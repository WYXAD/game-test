import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, ShoppingCart, Trophy, Info } from 'lucide-react';

// --- カードデータ定義 (AWS Builder Cards 2nd Edition準拠) ---
const CARDS = {
  STARTER: { id: 'starter', name: 'Starter Card', cost: 0, credit: 1, type: 'Starter', color: 'bg-orange-50 border-orange-200' },
  MARKET: [
    { id: 'ec2', name: 'Amazon EC2', cost: 0, credit: 1, type: 'Compute', color: 'bg-blue-50 border-blue-200', effect: 'Foundation of compute.' },
    { id: 'asg', name: 'EC2 Auto Scaling', cost: 3, credit: 1, type: 'Compute', color: 'bg-blue-100 border-blue-400', effect: 'Draw +1 card', condition: 'ec2' },
    { id: 's3', name: 'Amazon S3', cost: 0, credit: 1, type: 'Storage', color: 'bg-green-50 border-green-200', effect: 'Standard object storage.' },
    { id: 'lambda', name: 'AWS Lambda', cost: 4, credit: 2, type: 'Serverless', color: 'bg-purple-50 border-purple-200', effect: 'Event-driven compute.' },
    { id: 'rds', name: 'Amazon RDS', cost: 5, credit: 2, type: 'Database', color: 'bg-indigo-50 border-indigo-200', effect: 'Managed relational DB.' },
  ],
  SCORE: [
    { id: 'wa1', name: 'Well-Architected (Small)', cost: 3, points: 1, color: 'bg-yellow-50 border-yellow-300' },
    { id: 'wa3', name: 'Well-Architected (Large)', cost: 8, points: 3, color: 'bg-yellow-100 border-yellow-500' },
  ]
};

const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

export default function App() {
  const [deck, setDeck] = useState(shuffle(Array(10).fill(CARDS.STARTER)));
  const [hand, setHand] = useState([]);
  const [discard, setDiscard] = useState([]);
  const [playArea, setPlayArea] = useState([]);
  const [credits, setCredits] = useState(0);
  const [points, setPoints] = useState(0);
  const [logs, setLogs] = useState(["Game Start! Build your AWS architecture."]);

  useEffect(() => { initialDraw(); }, []);

  const addLog = (msg) => setLogs(prev => [msg, ...prev].slice(0, 5));

  const initialDraw = () => {
    const initialDeck = shuffle(Array(10).fill(CARDS.STARTER));
    drawCards(5, initialDeck, []);
  };

  const drawCards = (count, currentDeck, currentDiscard) => {
    let d = [...currentDeck];
    let disc = [...currentDiscard];
    let h = [];
    for (let i = 0; i < count; i++) {
      if (d.length === 0) {
        d = shuffle(disc);
        disc = [];
      }
      if (d.length > 0) h.push(d.pop());
    }
    setHand(prev => [...prev, ...h]);
    setDeck(d);
    setDiscard(disc);
  };

  const playCard = (card, index) => {
    const newHand = [...hand];
    newHand.splice(index, 1);
    setHand(newHand);
    setPlayArea([...playArea, card]);
    setCredits(prev => prev + (card.credit || 0));

    // 特殊効果ロジック (Auto Scaling)
    if (card.id === 'asg') {
      const hasEC2 = playArea.some(c => c.id === 'ec2');
      if (hasEC2) {
        addLog("ASG Effect triggered: Draw 1 card!");
        drawCards(1, deck, discard);
      }
    }
  };

  const buyCard = (card) => {
    if (credits >= card.cost) {
      setCredits(prev => prev - card.cost);
      if (card.points) {
        setPoints(prev => prev + card.points);
        addLog(`Achieved ${card.name}! +${card.points}pt`);
      } else {
        setDiscard([...discard, card]);
        addLog(`Bought ${card.name}`);
      }
    }
  };

  const endTurn = () => {
    setDiscard(prev => [...prev, ...playArea, ...hand]);
    setPlayArea([]);
    setHand([]);
    setCredits(0);
    drawCards(5, deck, [...discard, ...playArea, ...hand]);
    addLog("Turn ended. Next phase.");
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 min-h-screen bg-slate-900 text-slate-100 shadow-2xl overflow-hidden flex flex-col">
      {/* Status Bar */}
      <div className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-orange-500 p-2 rounded-lg"><Play fill="white" size={24} /></div>
          <div>
            <h1 className="text-xl font-black tracking-tighter">AWS BUILDER CARDS <span className="text-orange-500 italic text-sm ml-2">2nd EDITION</span></h1>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-center bg-slate-900 px-6 py-2 rounded-xl border border-slate-700">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Available Credits</p>
            <p className="text-2xl font-mono text-blue-400 font-bold">{credits} <span className="text-sm">Ⓒ</span></p>
          </div>
          <div className="text-center bg-slate-900 px-6 py-2 rounded-xl border border-slate-700">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Total Score</p>
            <p className="text-2xl font-mono text-yellow-400 font-bold">{points} <span className="text-sm">PT</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-grow overflow-hidden">
        {/* Left: Market */}
        <div className="md:col-span-3 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          <section>
            <h2 className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest"><ShoppingCart size={14}/> AWS Service Market</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {CARDS.MARKET.map(card => (
                <MarketItem key={card.id} card={card} onBuy={() => buyCard(card)} canAfford={credits >= card.cost} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest"><Trophy size={14}/> Well-Architected Framework</h2>
            <div className="flex gap-4">
              {CARDS.SCORE.map(card => (
                <MarketItem key={card.id} card={card} onBuy={() => buyCard(card)} canAfford={credits >= card.cost} />
              ))}
            </div>
          </section>

          {/* Play Area */}
          <section className="bg-slate-800/30 rounded-3xl p-6 border-2 border-dashed border-slate-700 min-h-[160px]">
            <h2 className="text-center text-[10px] font-bold text-slate-600 uppercase mb-4 tracking-widest">Active Architecture</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {playArea.map((card, i) => <Card key={i} card={card} isMini />)}
            </div>
          </section>
        </div>

        {/* Right: Info & Logs */}
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest"><Info size={14}/> Deployment Logs</h2>
            <div className="space-y-3 font-mono text-xs">
              {logs.map((log, i) => (
                <p key={i} className={`${i === 0 ? 'text-orange-400' : 'text-slate-500'}`}>{`> ${log}`}</p>
              ))}
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-800 space-y-4 text-center">
             <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                <span>Deck: {deck.length}</span>
                <span>Discard: {discard.length}</span>
             </div>
             <button onClick={endTurn} className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2">
               NEXT TURN <RotateCcw size={18} />
             </button>
          </div>
        </div>
      </div>

      {/* Hand Area */}
      <div className="mt-8 flex justify-center pb-4">
        <div className="flex gap-4 p-6 bg-slate-800/80 rounded-3xl border border-slate-700 backdrop-blur-md shadow-2xl">
          {hand.map((card, i) => (
            <Card key={i} card={card} onClick={() => playCard(card, i)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ card, onClick, isMini }) {
  return (
    <div 
      onClick={onClick}
      className={`${card.color} ${isMini ? 'w-20 h-28' : 'w-32 h-48'} rounded-xl p-3 text-slate-900 shadow-lg cursor-pointer transform transition-all hover:-translate-y-4 hover:rotate-1 flex flex-col justify-between border-b-4`}
    >
      <div>
        <div className="text-[8px] font-black uppercase opacity-60 mb-1">{card.type}</div>
        <div className="text-[10px] font-black leading-none uppercase">{card.name}</div>
      </div>
      <div className="text-center font-bold text-xl my-2">
        {card.id === 'ec2' ? '☁️' : card.id === 's3' ? '📦' : card.id === 'lambda' ? 'λ' : card.points ? '🏆' : '⚡'}
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs font-black">{card.credit ? `+${card.credit}` : card.points ? `${card.points}pt` : ''}</span>
        <span className="text-[8px] font-bold opacity-40">AWS v2</span>
      </div>
    </div>
  );
}

function MarketItem({ card, onBuy, canAfford }) {
  return (
    <div 
      onClick={canAfford ? onBuy : null}
      className={`p-3 rounded-2xl border flex flex-col items-center text-center transition-all ${canAfford ? 'bg-slate-800 border-slate-600 cursor-pointer hover:border-orange-500' : 'bg-slate-900 border-slate-800 opacity-40'}`}
    >
      <span className="text-[10px] font-bold text-blue-400 mb-2 font-mono">COST: {card.cost}</span>
      <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center text-slate-900 font-bold mb-2 shadow-inner text-xs`}>
        {card.id.substring(0,2).toUpperCase()}
      </div>
      <p className="text-[10px] font-black text-slate-100 uppercase leading-none mb-1">{card.name}</p>
      <p className="text-[8px] text-slate-500">{card.effect}</p>
    </div>
  );
}