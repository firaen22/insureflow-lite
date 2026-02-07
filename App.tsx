import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DashboardView } from './components/DashboardView';
import { UploadView } from './components/UploadView';
import { ClientsView } from './components/ClientsView';
import { ProductLibraryView } from './components/ProductLibraryView';
import { ClientDetailsView } from './components/ClientDetailsView';
import { RemindersView } from './components/RemindersView';
import { GoogleSheetsSync } from './components/GoogleSheetsSync';
import { SettingsView } from './components/SettingsView';
import { AppView, Language, Client, PolicyData, Product, AppSettings } from './types';
import { TRANSLATIONS, MOCK_CLIENTS, RECENT_POLICIES, PRODUCT_LIBRARY } from './constants';

import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from "@clerk/clerk-react";
import { setGoogleToken, initGoogleClient, syncOnLogin, saveData, getIsSignedIn, trySilentSignIn } from './services/googleSheets';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  // Settings State
  const [settings, setSettings] = useState<AppSettings>({
    language: 'en',
    theme: 'light',
    reminderDays: 60
  });
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);

  const [syncStatus, setSyncStatus] = useState<string>('');

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Lifted State
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [policies, setPolicies] = useState<PolicyData[]>(RECENT_POLICIES);
  const [products, setProducts] = useState<Product[]>(PRODUCT_LIBRARY);

  const t = TRANSLATIONS[settings.language];

  // Persistence Logic (Feature E)
  useEffect(() => {
    const savedClients = localStorage.getItem('insureflow_clients');
    const savedPolicies = localStorage.getItem('insureflow_policies');
    const savedProducts = localStorage.getItem('insureflow_products');
    const savedSettings = localStorage.getItem('insureflow_settings');

    if (savedClients) setClients(JSON.parse(savedClients));
    if (savedPolicies) setPolicies(JSON.parse(savedPolicies));
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedSettings) setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
  }, []);

  const { getToken, userId } = useAuth();

  // 1. Clerk Token Sync (Restored with Safety Check)
  useEffect(() => {
    const syncGoogleToken = async () => {
      try {
        // Attempt to get token from Clerk (in case "oauth_google" template is configured for Access Tokens)
        const token = await getToken({ template: "oauth_google" });

        if (token) {
          // SAFETY CHECK: Clerk often returns a JWT (starts with 'ey') by default.
          // Google Sheets API needs an OAuth Access Token (opaque, often starts with 'ya29').
          // Passing a JWT to GAPI causes "Invalid authentication credentials".
          if (token.startsWith('ey')) {
            console.warn("Clerk returned a JWT, not a Google Access Token. Ignoring to prevent auth errors. Configure your Clerk 'oauth_google' template to return the access_token if possible, or use the manual 'Sign In' button.");
            return;
          }

          console.log("Successfully retrieved potential Google Access Token from Clerk");
          setGoogleToken(token);

          // Re-init Google Client to pick up the token
          await initGoogleClient();

          // Attempt Auto-Sync
          if (getIsSignedIn()) {
            setSyncStatus('Syncing...');
            const syncResult = await syncOnLogin();
            if (syncResult.data) {
              console.log("Clerk-based Auto-sync successful", syncResult.data);
              setSyncStatus('Synced');
              if (syncResult.spreadsheetId) setSpreadsheetId(syncResult.spreadsheetId);
              if (syncResult.data.clients) setClients(syncResult.data.clients);
              if (syncResult.data.policies) setPolicies(syncResult.data.policies);
              if (syncResult.data.products) setProducts(syncResult.data.products);
            } else {
              setSyncStatus('');
            }
          }
        }
      } catch (e) {
        console.error("Failed to sync Google Token from Clerk", e);
        setSyncStatus('Sync Error');
      }
    };

    if (userId) {
      syncGoogleToken();
    }
  }, [userId, getToken]);

  // 2. Auto-Init and Load from Google Sheets (LocalStorage Fallback + Silent Sign-In)
  useEffect(() => {
    const initAndSync = async () => {
      try {
        await initGoogleClient();

        // Check if we have a token (from localStorage or GAPI)
        let signedIn = getIsSignedIn();

        // If NOT signed in, try Silent Sign-In (if authorized before)
        if (!signedIn) {
          // Only if we haven't explicitly signed out recently? 
          // For now, always try silent sign-in on fresh load.
          const silentSuccess = await trySilentSignIn();
          if (silentSuccess) signedIn = true;
        }

        if (signedIn) {
          console.log("Auto-sync: User is signed in via LocalStorage or Silent Auth, attempting to load data...");
          setSyncStatus('Loading...');
          const syncResult = await syncOnLogin();
          if (syncResult.data && syncResult.spreadsheetId) {
            console.log("Auto-sync: Data loaded successfully");
            setSyncStatus('Synced');
            setSpreadsheetId(syncResult.spreadsheetId);
            if (syncResult.data.clients) setClients(syncResult.data.clients);
            if (syncResult.data.policies) setPolicies(syncResult.data.policies);
            if (syncResult.data.products) setProducts(syncResult.data.products);
          } else {
            setSyncStatus('');
          }
        }
      } catch (e) {
        console.error("Auto-sync initialization failed", e);
        setSyncStatus('Sync Error');
      }
    };

    initAndSync();
  }, []);

  // 3. Auto-Save to Google Sheets
  useEffect(() => {
    if (!spreadsheetId) return;

    const timeoutId = setTimeout(async () => {
      console.log("Auto-sync: Saving changes to Google Sheets...");
      setSyncStatus('Saving...');
      try {
        await saveData(spreadsheetId, clients, policies, products);
        console.log("Auto-sync: Save successful at " + new Date().toLocaleTimeString());
        setSyncStatus('Saved');
        setTimeout(() => setSyncStatus('Synced'), 2000); // Revert to Synced
      } catch (error: any) {
        console.error("Auto-sync: Save failed", error);
        setSyncStatus('Save Error');
        // If auth error, stop trying to save to prevent loops/spam
        const msg = error.message || JSON.stringify(error);
        if (msg.includes("401") || msg.includes("403") || msg.includes("invalid authentication")) {
          setSpreadsheetId(null); // Disconnect
          setSyncStatus('Auth Error');
          alert("Google Sheets session expired. Please sign in again via the sync button.");
        }
      }
    }, 3000); // 3-second debounce

    return () => clearTimeout(timeoutId);
  }, [clients, policies, products, spreadsheetId]);

  // Persistence Logic (Feature E)
  useEffect(() => {
    localStorage.setItem('insureflow_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('insureflow_policies', JSON.stringify(policies));
  }, [policies]);

  useEffect(() => {
    localStorage.setItem('insureflow_products', JSON.stringify(products));
  }, [products]);

  // Settings are likely handled by a context now, but keeping for compatibility if local
  // useEffect(() => {
  //   localStorage.setItem('insureflow_settings', JSON.stringify(settings));
  // }, [settings]);

  const handleSavePolicy = async (policy: PolicyData, isNewProduct: boolean) => {
    // 1. Add Policy Locally
    setPolicies(prev => [policy, ...prev]);

    // 2. Add/Update Client Locally
    setClients(prev => {
      const existingClientIndex = prev.findIndex(c =>
        c.name === policy.holderName &&
        (!policy.clientBirthday || !c.birthday || c.birthday === policy.clientBirthday)
      );

      if (existingClientIndex >= 0) {
        const updatedClients = [...prev];
        const client = updatedClients[existingClientIndex];

        // Update client info if new info is available
        updatedClients[existingClientIndex] = {
          ...client,
          totalPolicies: client.totalPolicies + 1,
          lastContact: new Date().toISOString().split('T')[0],
          birthday: policy.clientBirthday || client.birthday,
          tags: [...new Set([...client.tags, ...(policy.extractedTags || [])])]
        };
        return updatedClients;
      } else {
        const newClient: Client = {
          id: `c-${Date.now()}`,
          name: policy.holderName,
          email: 'pending@email.com',
          phone: 'Pending',
          birthday: policy.clientBirthday || '1990-01-01',
          totalPolicies: 1,
          lastContact: new Date().toISOString().split('T')[0],
          status: 'Lead',
          tags: policy.extractedTags || []
        };
        return [newClient, ...prev];
      }
    });

    // 3. Add Product to Library
    if (isNewProduct) {
      const newProduct: Product = {
        name: policy.planName,
        provider: 'Unknown',
        type: policy.type,
        defaultTags: [policy.type]
      };
      if (!products.some(p => p.name === newProduct.name)) {
        setProducts(prev => [...prev, newProduct]);
      }
    }
  };

  const handleManualPolicyAdd = (policy: PolicyData, clientId: string) => {
    handleSavePolicy(policy, false);
  };

  const handleUpdatePolicy = (updatedPolicy: PolicyData) => {
    setPolicies(prev => prev.map(p => p.id === updatedPolicy.id ? updatedPolicy : p));
  };

  const handleDeletePolicy = (policyId: string) => {
    const policy = policies.find(p => p.id === policyId);
    if (!policy) return;

    setPolicies(prev => prev.filter(p => p.id !== policyId));
    setClients(prev => prev.map(client => {
      if (client.name === policy.holderName) {
        return { ...client, totalPolicies: Math.max(0, client.totalPolicies - 1) };
      }
      return client;
    }));
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const handleAddClient = (newClient: Client) => {
    setClients(prev => [newClient, ...prev]);
  };

  const handleViewClientDetails = (client: Client) => {
    setSelectedClientId(client.id);
    setCurrentView(AppView.CLIENT_DETAILS);
  };

  const handleBackToClients = () => {
    setSelectedClientId(null);
    setCurrentView(AppView.CLIENTS);
  };

  const handleUpdateProduct = (updatedProduct: Product, originalName: string) => {
    setProducts(prev => prev.map(p => p.name === originalName ? updatedProduct : p));
  };

  const handleAddProduct = (newProduct: Product) => {
    if (products.some(p => p.name === newProduct.name)) {
      alert("A product with this name already exists.");
      return;
    }
    setProducts(prev => [newProduct, ...prev]);
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedClientPolicies = selectedClient
    ? policies.filter(p => p.holderName === selectedClient.name)
    : [];

  return (
    <>
      <SignedOut>
        <div className="h-screen w-full flex items-center justify-center bg-slate-50">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-slate-900">InsureFlow Lite</h1>
            <p className="text-slate-500">Please sign in to continue</p>
            <SignInButton mode="modal">
              <button className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <Layout
          currentView={currentView}
          onChangeView={setCurrentView}
          language={settings.language}
          onToggleLanguage={() => setSettings(prev => ({ ...prev, language: prev.language === 'en' ? 'zh' : 'en' }))}
          t={t}
          syncStatus={syncStatus}
        >
          <div className="absolute top-4 right-20 z-10">
            <UserButton />
          </div>
          {currentView === AppView.DASHBOARD && (
            <DashboardView t={t.dashboard} clients={clients} policies={policies} />
          )}
          {currentView === AppView.UPLOAD && (
            <UploadView t={t.upload} products={products} onSave={handleSavePolicy} />
          )}
          {currentView === AppView.CLIENTS && (
            <ClientsView
              t={t.clients}
              clients={clients}
              policies={policies}
              products={products}
              onUpdateClient={handleUpdateClient}
              onAddClient={handleAddClient}
              onAddPolicy={handleManualPolicyAdd}
              onViewDetails={handleViewClientDetails}
            />
          )}
          {currentView === AppView.CLIENT_DETAILS && selectedClient && (
            <ClientDetailsView
              t={t.clientDetails}
              client={selectedClient}
              policies={selectedClientPolicies}
              products={products}
              onUpdatePolicy={handleUpdatePolicy}
              onDeletePolicy={handleDeletePolicy}
              onUpdateClient={handleUpdateClient}
              onBack={handleBackToClients}
            />
          )}
          {currentView === AppView.REMINDERS && (
            <RemindersView
              t={t.reminders}
              policies={policies}
              clients={clients}
              onUploadRenewal={() => setCurrentView(AppView.UPLOAD)}
              reminderDays={settings.reminderDays}
            />
          )}
          {currentView === AppView.PRODUCTS && (
            <ProductLibraryView
              t={t.products}
              products={products}
              onUpdateProduct={handleUpdateProduct}
              onAddProduct={handleAddProduct}
            />
          )}
          {currentView === AppView.SETTINGS && (
            <SettingsView
              settings={settings}
              onUpdateSettings={setSettings}
              spreadsheetId={spreadsheetId}
              setSpreadsheetId={setSpreadsheetId}
              clients={clients}
              policies={policies}
              products={products}
            />
          )}
          <GoogleSheetsSync
            clients={clients}
            policies={policies}
            products={products}
            onSync={(newClients, newPolicies, newProducts) => {
              if (newClients) setClients(newClients);
              if (newPolicies) setPolicies(newPolicies);
              if (newProducts) setProducts(newProducts);
            }}
            spreadsheetId={spreadsheetId}
            setSpreadsheetId={setSpreadsheetId}
          />
        </Layout>
      </SignedIn>
    </>
  );
};

export default App;