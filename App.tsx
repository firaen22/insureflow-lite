import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { DashboardView } from './components/DashboardView';
import { UploadView } from './components/UploadView';
import { ClientsView } from './components/ClientsView';
import { ProductLibraryView } from './components/ProductLibraryView';
import { ClientDetailsView } from './components/ClientDetailsView';
import { RemindersView } from './components/RemindersView';
import { AppView, Language, Client, PolicyData, Product } from './types';
import { TRANSLATIONS, MOCK_CLIENTS, RECENT_POLICIES, PRODUCT_LIBRARY } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [language, setLanguage] = useState<Language>('en');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  // Lifted State
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [policies, setPolicies] = useState<PolicyData[]>(RECENT_POLICIES);
  const [products, setProducts] = useState<Product[]>(PRODUCT_LIBRARY);

  const t = TRANSLATIONS[language];

  const handleSavePolicy = async (policy: PolicyData, isNewProduct: boolean) => {
    // 1. Add Policy Locally
    setPolicies(prev => [policy, ...prev]);

    // 2. Add/Update Client Locally
    setClients(prev => {
      const existingClientIndex = prev.findIndex(c => c.name === policy.holderName);
      
      if (existingClientIndex >= 0) {
        const updatedClients = [...prev];
        const client = updatedClients[existingClientIndex];
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
    <Layout 
      currentView={currentView} 
      onChangeView={setCurrentView}
      language={language}
      onToggleLanguage={() => setLanguage(prev => prev === 'en' ? 'zh' : 'en')}
      t={t}
    >
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
          onBack={handleBackToClients}
        />
      )}
      {currentView === AppView.REMINDERS && (
        <RemindersView
          t={t.reminders}
          policies={policies}
          clients={clients}
          onUploadRenewal={() => setCurrentView(AppView.UPLOAD)}
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
    </Layout>
  );
};

export default App;