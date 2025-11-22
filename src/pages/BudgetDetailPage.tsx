/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/pages/BudgetDetailPage.tsx
// 🧠 Page détaillée d'un budget - VERSION FINALE

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useBudgetDetail } from '../hooks/useBudgetDetail';
import { BudgetDetailStats } from '../components/budget-detail/BudgetDetailStats';
import { BudgetDetailRecipients } from '../components/budget-detail/BudgetDetailRecipients';
import { BudgetDetailInsights } from '../components/budget-detail/BudgetDetailInsights';
import { BudgetDetailGiftsByRecipient } from '../components/budget-detail/BudgetDetailGiftsByRecipient';
import { BudgetDetailGiftsTimeline } from '../components/budget-detail/BudgetDetailGiftsTimeline';
import { BudgetDetailGiftsAll } from '../components/budget-detail/BudgetDetailGiftsAll';
import { BudgetLimitModal } from '../components/budget/BudgetLimitModal';
import { ExternalGiftModal } from '../components/budget/ExternalGiftModal';
import { FOCUS_RING, BUDGET_TYPE_LABELS } from '../utils/constants';
import type { BudgetType } from '../types/db';

type TabType = 'recipients' | 'timeline' | 'all';

export default function BudgetDetailPage() {
  const { year: yearParam, type: typeParam } = useParams<{ year: string; type: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const year = parseInt(yearParam || new Date().getFullYear().toString());
  const budgetType = typeParam as BudgetType;

  const {
    gifts,
    recipientGroups,
    loading,
    error,
    totalSpent,
    limit,
    stats,
    insights,
    updatePaidAmount,
    deleteExternalGift,
    cancelClaim,
  } = useBudgetDetail(user?.id || '', year, budgetType);

  const [activeTab, setActiveTab] = useState<TabType>('recipients');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showExternalGiftModal, setShowExternalGiftModal] = useState(false);
  const [editingGift, setEditingGift] = useState<any>(null);
  const [editingPaidAmount, setEditingPaidAmount] = useState<{ [key: string]: string }>({});

  const budgetLabelWithEmoji = BUDGET_TYPE_LABELS[budgetType] || budgetType;
  const budgetLabel = budgetLabelWithEmoji.replace(/^[^\s]+\s/, '');
  const budgetEmoji = budgetLabelWithEmoji.match(/^[^\s]+/)?.[0] || '💰';

  const handleExportCSV = () => {
    const csvContent = [
      ['Titre', 'Destinataire', 'Prix annoncé', 'Prix payé', 'Frais de port', 'Total', 'Date', 'Source'],
      ...gifts.map(g => [
        g.title,
        g.recipient_name,
        g.announced_price.toFixed(2),
        (g.paid_amount || g.announced_price).toFixed(2),
        g.shipping_cost.toFixed(2),
        g.total_price.toFixed(2),
        new Date(g.date).toLocaleDateString('fr-FR'),
        g.source === 'in-app' ? 'In-app' : 'Hors app',
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `budget-${budgetType}-${year}.csv`;
    link.click();
  };

  const handleSavePaidAmount = async (claimId: string) => {
    const value = editingPaidAmount[claimId];
    if (!value) return;

    const amount = parseFloat(value);
    if (isNaN(amount) || amount < 0) {
      alert('Montant invalide');
      return;
    }

    try {
      await updatePaidAmount(claimId, amount);
    } catch (err) {
      console.error('❌ Erreur updatePaidAmount:', err);
      alert('Erreur lors de la mise à jour');
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-yellow-800 text-lg font-semibold">Connectez-vous pour accéder à vos budgets</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Chargement du budget...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
          <p className="font-semibold text-xl mb-4 text-red-800">❌ Erreur</p>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard?view=budgets')}
            className={`px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all ${FOCUS_RING}`}
          >
            Retour aux budgets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate('/dashboard?view=budgets')}
          className={`inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold self-start ${FOCUS_RING} rounded-lg px-2 py-1`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux budgets
        </button>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3">
          <span className="text-4xl">{budgetEmoji}</span>
          {budgetLabel} {year}
        </h1>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* BARRE VERTE + DONUT (Pleine largeur séparés) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <BudgetDetailStats
        userId={user.id}
        year={year}
        budgetType={budgetType}
        totalSpent={totalSpent}
        limit={limit}
        stats={stats}
        budgetStatus={insights.budget_status}
        onSetLimit={() => setShowLimitModal(true)}
        onExportCSV={handleExportCSV}
        onAddExternalGift={() => {
          setEditingGift(null);
          setShowExternalGiftModal(true);
        }}
      />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* DESTINATAIRES (Pleine largeur) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <BudgetDetailRecipients
        recipientGroups={recipientGroups}
        onRecipientClick={() => setActiveTab('recipients')}
      />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* INSIGHTS (Pleine largeur) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <BudgetDetailInsights insights={insights} stats={stats} />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ONGLETS (Desktop) / SELECT (Mobile) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="hidden sm:block border-b-2 border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('recipients')}
            className={`px-6 py-3 font-bold transition-all border-b-4 ${
              activeTab === 'recipients'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            👥 Par destinataire ({recipientGroups.length})
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-6 py-3 font-bold transition-all border-b-4 ${
              activeTab === 'timeline'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📅 Timeline
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 font-bold transition-all border-b-4 ${
              activeTab === 'all'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🎁 Tous ({gifts.length})
          </button>
        </div>
      </div>

      <div className="sm:hidden">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as TabType)}
          className={`w-full px-4 py-3 text-base font-bold border-2 border-purple-300 rounded-xl bg-white ${FOCUS_RING}`}
        >
          <option value="recipients">👥 Par destinataire ({recipientGroups.length})</option>
          <option value="timeline">📅 Timeline</option>
          <option value="all">🎁 Tous ({gifts.length})</option>
        </select>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* CONTENU DES ONGLETS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'recipients' && (
        <BudgetDetailGiftsByRecipient
          recipientGroups={recipientGroups}
          editingPaidAmount={editingPaidAmount}
          onEditPaidAmount={(id, val) => setEditingPaidAmount({ ...editingPaidAmount, [id]: val })}
          onSavePaidAmount={handleSavePaidAmount}
          onEditExternalGift={(gift) => {
            setEditingGift(gift);
            setShowExternalGiftModal(true);
          }}
          onDeleteExternalGift={deleteExternalGift}
          onCancelClaim={cancelClaim}
        />
      )}

      {activeTab === 'timeline' && <BudgetDetailGiftsTimeline gifts={gifts} />}

      {activeTab === 'all' && <BudgetDetailGiftsAll gifts={gifts} />}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <BudgetLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        userId={user.id}
        budgetType={budgetType}
        budgetName={budgetLabel}
        year={year}
        currentLimit={limit}
        onSuccess={() => {
          setShowLimitModal(false);
          window.location.reload();
        }}
      />

      <ExternalGiftModal
        isOpen={showExternalGiftModal}
        onClose={() => {
          setShowExternalGiftModal(false);
          setEditingGift(null);
        }}
        userId={user.id}
        onSuccess={() => {
          setShowExternalGiftModal(false);
          setEditingGift(null);
          window.location.reload();
        }}
        editingGift={editingGift}
      />
    </div>
  );
}
