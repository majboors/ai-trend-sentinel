import React from 'react';
import { CoinAnalysisCard } from '../CoinAnalysisCard';
import { LiveAnalysisSidebar } from './LiveAnalysisSidebar';
import type { Coin } from '../types';

interface AnalysisViewProps {
  coin: Coin;
  showLiveAnalysis: boolean;
  onNext: () => void;
  onBuy: () => void;
  onLiveAnalyze: () => void;
  onCloseLiveAnalysis: () => void;
}

export function AnalysisView({ 
  coin, 
  showLiveAnalysis, 
  onNext, 
  onBuy, 
  onLiveAnalyze,
  onCloseLiveAnalysis
}: AnalysisViewProps) {
  return (
    <div className="relative flex">
      <div className="flex-1">
        <CoinAnalysisCard
          coin={coin}
          onNext={onNext}
          onBuy={onBuy}
          onLiveAnalyze={onLiveAnalyze}
        />
      </div>
      {showLiveAnalysis && <LiveAnalysisSidebar onClose={onCloseLiveAnalysis} />}
    </div>
  );
}