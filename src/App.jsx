import React, { useState, useEffect } from 'react';
import { RotateCcw, User, History, Undo2, Trophy, Settings2, LineChart as ChartIcon, Target, Users, Play, Plus, Trash2, X, Home, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import confetti from 'canvas-confetti';

const App = () => {
  // Setup State
  const [gameStarted, setGameStarted] = useState(false);
  const [playerNames, setPlayerNames] = useState(['Spieler 1', 'Spieler 2']);
  const [startScore, setStartScore] = useState(301);
  const [isNoobMode, setIsNoobMode] = useState(false);

  // Game State
  const [scores, setScores] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [history, setHistory] = useState([]);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [message, setMessage] = useState('Wähle deine Würfe.');
  const [turnThrows, setTurnThrows] = useState([]);
  const [multiplier, setMultiplier] = useState(1);
  const [winner, setWinner] = useState(null);

  const dartValues = Array.from({ length: 20 }, (_, i) => i + 1);

  const startGame = () => {
    setScores(new Array(playerNames.length).fill(startScore));
    setScoreHistory(playerNames.map(() => [{ turn: 0, score: startScore }]));
    setCurrentPlayer(0);
    setHistory([]);
    setTurnThrows([]);
    setMultiplier(1);
    setWinner(null);
    setGameStarted(true);
    setMessage(`Spiel gestartet! ${playerNames[0]} fängt an.`);
  };

  const addPlayer = () => {
    if (playerNames.length < 6) {
      setPlayerNames([...playerNames, `Spieler ${playerNames.length + 1}`]);
    }
  };

  const removePlayer = (index) => {
    if (playerNames.length > 1) {
      const next = [...playerNames];
      next.splice(index, 1);
      setPlayerNames(next);
    }
  };

  const updatePlayerName = (index, name) => {
    const next = [...playerNames];
    next[index] = name;
    setPlayerNames(next);
  };

  const getCheckoutSuggestion = (score) => {
    if (score > 170 || score < 2) return null;
    const checkouts = {
      170: 'T20 T20 BULL', 167: 'T20 T19 BULL', 164: 'T20 T18 BULL', 161: 'T20 T17 BULL',
      160: 'T20 T20 D20', 158: 'T20 T20 D19', 157: 'T20 T19 D20', 156: 'T20 T20 D18',
      155: 'T20 T19 D19', 154: 'T20 T18 D20', 153: 'T20 T19 D18', 152: 'T20 T20 D16',
      151: 'T20 T17 D20', 150: 'T20 T18 D18', 149: 'T20 T19 D16', 148: 'T20 T16 D20',
      147: 'T20 T17 D18', 146: 'T20 T18 D16', 145: 'T20 T15 D20', 144: 'T20 T20 D12',
      143: 'T20 T17 D16', 142: 'T20 T14 D20', 141: 'T20 T15 D18', 140: 'T20 T20 D10',
      130: 'T20 T20 D5', 121: 'T20 11 BULL', 100: 'T20 D20', 90: 'T18 D18', 80: 'T20 D10',
      70: 'T10 D20', 60: '20 D20', 50: '10 D20', 40: 'D20', 32: 'D16', 24: 'D12', 20: 'D10', 16: 'D8', 10: 'D5', 8: 'D4', 4: 'D2', 2: 'D1'
    };
    return checkouts[score] || 'Suchen...';
  };

  const handleScoreClick = (value) => {
    if (turnThrows.length >= 3 || winner !== null) return;

    if (value === 0 && multiplier !== 1) {
      setMessage('Miss (0) kann kein Doppel/Triple sein!');
      setMultiplier(1);
      return;
    }
    if (value === 25 && multiplier === 3) {
      setMessage('Triple 25 existiert nicht!');
      setMultiplier(1);
      return;
    }
    if (value === 50 && multiplier !== 1) {
      setMessage('Bullseye ist bereits ein Doppel-Feld!');
      setMultiplier(1);
      return;
    }

    let finalValue = value * multiplier;
    let isDouble = multiplier === 2;

    if (value === 25) {
      finalValue = 25 * multiplier;
      isDouble = multiplier === 2;
    } else if (value === 50) {
      finalValue = 50;
      isDouble = true;
    }
    
    const newThrow = { val: finalValue, isDouble, label: getLabel(value, multiplier) };
    const newTurnThrows = [...turnThrows, newThrow];
    
    setTurnThrows(newTurnThrows);
    setMultiplier(1);
    processThrow(newThrow, newTurnThrows);
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const getLabel = (v, m) => {
    if (v === 0) return '0';
    if (v === 25) return m === 2 ? 'BULL' : '25';
    if (v === 50) return 'BULL';
    if (m === 3) return `T${v}`;
    if (m === 2) return `D${v}`;
    return `${v}`;
  };

  const processThrow = (currentThrow, currentTurnThrows) => {
    const pIdx = currentPlayer;
    let tempScore = scores[pIdx];
    for (const t of turnThrows) {
      tempScore -= t.val;
    }
    const remaining = tempScore - currentThrow.val;

    const isBust = isNoobMode ? remaining < 0 : (remaining < 0 || remaining === 1);

    if (isBust) {
      setMessage(`Bust! ${playerNames[pIdx]} bleibt bei ${scores[pIdx]}`);
      endTurn(true, currentTurnThrows);
    } else if (remaining === 0) {
      if (isNoobMode || currentThrow.isDouble) {
        triggerConfetti();
        const finalScores = [...scores];
        finalScores[pIdx] = 0;
        setScores(finalScores);
        setScoreHistory(prev => {
          const next = [...prev];
          next[pIdx] = [...next[pIdx], { turn: next[pIdx].length, score: 0 }];
          return next;
        });
        setTimeout(() => setWinner(pIdx), 1500);
        setMessage(`SPIEL AUS! ${playerNames[pIdx]} gewinnt!`);
      } else {
        setMessage(`Bust! Kein Doppel zum Abschluss.`);
        endTurn(true, currentTurnThrows);
      }
    } else {
      if (currentTurnThrows.length === 3) {
        const totalTurn = currentTurnThrows.reduce((a, b) => a + b.val, 0);
        const newScore = scores[pIdx] - totalTurn;
        setScores(prev => {
          const next = [...prev];
          next[pIdx] = newScore;
          return next;
        });
        setScoreHistory(prev => {
          const next = [...prev];
          next[pIdx] = [...next[pIdx], { turn: next[pIdx].length, score: newScore }];
          return next;
        });
        setMessage(`${playerNames[pIdx]} warf ${totalTurn}.`);
        endTurn(false, currentTurnThrows);
      }
    }
  };

  const endTurn = (isBust, finalTurnThrows, isWin = false) => {
    const total = isBust ? 0 : finalTurnThrows.reduce((a, b) => a + b.val, 0);
    if (!isWin) {
      setHistory(prev => [{ 
        player: currentPlayer, 
        score: total, 
        throws: finalTurnThrows.map(t => t.label),
        oldScore: scores[currentPlayer],
        isBust
      }, ...prev]);

      if (isBust) {
        setScoreHistory(prev => {
          const next = [...prev];
          next[currentPlayer] = [...next[currentPlayer], { turn: next[currentPlayer].length, score: scores[currentPlayer] }];
          return next;
        });
      }

      setTimeout(() => {
        setTurnThrows([]);
        setCurrentPlayer(prev => (prev + 1) % playerNames.length);
      }, 800);
    }
  };

  const undoLastAction = () => {
    if (turnThrows.length > 0) {
      setTurnThrows(prev => prev.slice(0, -1));
      setMessage('Wurf rückgängig gemacht.');
    } else if (history.length > 0) {
      const lastTurn = history[0];
      setScores(prev => {
        const next = [...prev];
        next[lastTurn.player] = lastTurn.oldScore;
        return next;
      });
      setScoreHistory(prev => {
        const next = [...prev];
        next[lastTurn.player] = next[lastTurn.player].slice(0, -1);
        return next;
      });
      setCurrentPlayer(lastTurn.player);
      setHistory(prev => prev.slice(1));
      setMessage(`Turn von ${playerNames[lastTurn.player]} zurückgesetzt.`);
    }
  };

  const confirmReset = () => {
    if (window.confirm('Spiel wirklich abbrechen?')) {
      setGameStarted(false);
    }
  };

  const currentRemaining = scores[currentPlayer] - turnThrows.reduce((a, b) => a + b.val, 0);
  const suggestion = getCheckoutSuggestion(currentRemaining);

  const colors = ["#f59e0b", "#3b82f6", "#ef4444", "#10b981", "#8b5cf6", "#71717a"];
  const maxTurns = Math.max(...scoreHistory.map(h => h.length));
  const chartData = Array.from({ length: maxTurns }, (_, i) => {
    const entry = { turn: i };
    playerNames.forEach((name, pIdx) => {
      entry[name] = scoreHistory[pIdx][i] ? scoreHistory[pIdx][i].score : scoreHistory[pIdx][scoreHistory[pIdx].length - 1].score;
    });
    return entry;
  });

  if (!gameStarted) {
    return (
      <div className="max-w-md mx-auto p-6 flex flex-col items-center gap-8 min-h-screen">
        <header className="text-center">
          <h1 className="text-4xl font-black text-amber-500 tracking-tighter uppercase italic">Dart Counter</h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">Spielvorbereitung</p>
        </header>

        <div className="w-full space-y-6">
          {/* Mode Selection */}
          <div className="bg-zinc-800/50 p-4 rounded-3xl border border-zinc-700/50">
            <h2 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Settings2 size={14} /> Spielmodus
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[301, 501].map(m => (
                <button 
                  key={m}
                  onClick={() => setStartScore(m)}
                  className={`py-4 rounded-2xl font-black text-xl transition-all ${startScore === m ? 'bg-amber-500 text-zinc-900 shadow-lg shadow-amber-500/20' : 'bg-zinc-800 text-zinc-400'}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setIsNoobMode(!isNoobMode)}
              className={`w-full mt-3 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${
                isNoobMode ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-zinc-800 border-zinc-700 text-zinc-500'
              }`}
            >
              {isNoobMode ? 'Noob Mode (Any Out)' : 'Pro Mode (Double Out)'}
            </button>
          </div>

          {/* Player Management */}
          <div className="bg-zinc-800/50 p-4 rounded-3xl border border-zinc-700/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Users size={14} /> Spieler
              </h2>
              <button 
                onClick={addPlayer}
                disabled={playerNames.length >= 6}
                className="bg-amber-500/10 text-amber-500 p-2 rounded-xl disabled:opacity-30"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {playerNames.map((name, i) => (
                <div key={i} className="flex gap-2 animate-in slide-in-from-left-2 duration-300">
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => updatePlayerName(i, e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-all"
                  />
                  <button 
                    onClick={() => removePlayer(i)}
                    className="bg-red-500/10 text-red-500 p-3 rounded-xl"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={startGame}
          className="w-full bg-amber-500 text-zinc-900 font-black py-5 rounded-3xl text-xl hover:bg-amber-400 transition-all active:scale-95 shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3"
        >
          <Play size={24} fill="currentColor" />
          SPIEL STARTEN
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col items-center gap-6 select-none relative min-h-screen pb-20 overflow-hidden">
      
      {/* Redesigned Winner Overlay */}
      {winner !== null && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="w-full max-w-sm bg-zinc-900/80 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-500 slide-in-from-bottom-10">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full"></div>
              <div className="relative flex justify-center">
                <div className="p-5 bg-amber-500 rounded-full shadow-lg shadow-amber-500/30">
                  <Trophy size={48} className="text-zinc-900" />
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-8">
              <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.2em] italic">Match gewonnen!</h2>
              <div className="text-4xl font-black text-white tracking-tighter uppercase italic">{playerNames[winner]}</div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{startScore} {isNoobMode ? 'Any Out' : 'Double Out'}</p>
            </div>
            
            <div className="w-full h-48 bg-zinc-950/50 p-4 rounded-3xl border border-zinc-800/50 mb-8 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                  <XAxis dataKey="turn" hide />
                  <YAxis domain={[0, startScore]} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px', fontSize: '10px', fontWeight: 'bold' }} 
                    itemStyle={{ padding: '0px' }}
                  />
                  {playerNames.map((name, i) => (
                    <Line key={name} type="monotone" dataKey={name} stroke={colors[i % colors.length]} strokeWidth={4} dot={false} animationDuration={1500} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={startGame} 
                className="bg-amber-500 text-zinc-900 font-black py-4 rounded-2xl text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <RotateCcw size={16} /> Revanche
              </button>
              <button 
                onClick={() => setGameStarted(false)} 
                className="bg-zinc-800 text-white font-black py-4 rounded-2xl text-sm border border-zinc-700 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Home size={16} /> Menü
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game UI */}
      <header className="w-full flex justify-between items-center">
        <h1 className="text-2xl font-black text-amber-500 tracking-tighter uppercase italic">{startScore}</h1>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 text-[10px] font-bold uppercase text-zinc-500">
          {isNoobMode ? 'Noob Mode' : 'Pro Mode'}
        </div>
      </header>

      {/* Checkout Suggestion */}
      {!isNoobMode && suggestion && (
        <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-center justify-between animate-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-xl"><Target size={16} className="text-zinc-900" /></div>
            <div>
              <div className="text-[8px] font-black uppercase text-amber-500 tracking-widest">Finish</div>
              <div className="text-sm font-black text-white tracking-wide">{suggestion}</div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Player Grid */}
      <div className={`grid gap-3 w-full ${playerNames.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {playerNames.map((name, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border-2 transition-all duration-300 ${currentPlayer === idx ? 'border-amber-500 bg-amber-500/10 scale-[1.02]' : 'border-zinc-800 bg-zinc-800/30 opacity-40'}`}>
            <div className="flex items-center gap-2 mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-500 truncate">
              {currentPlayer === idx && <Award size={10} className="text-amber-500" />} {name}
            </div>
            <div className="text-4xl font-black tabular-nums tracking-tighter">{scores[idx]}</div>
          </div>
        ))}
      </div>

      {/* Aktueller Wurf */}
      <div className="w-full bg-zinc-800/50 p-4 rounded-2xl flex justify-between items-center border border-zinc-700/30 backdrop-blur-sm">
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className={`w-12 h-12 rounded-xl flex items-center justify-center font-black border-2 transition-all ${turnThrows[i] ? 'bg-amber-500 border-amber-500 text-zinc-900' : 'border-zinc-800 text-zinc-800'}`}>
              {turnThrows[i]?.label || ''}
            </div>
          ))}
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Rest</div>
          <div className="text-2xl font-black text-amber-500 tabular-nums">{currentRemaining}</div>
        </div>
      </div>

      {/* Keypad */}
      <div className="w-full space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {['SINGLE', 'DOUBLE', 'TRIPLE'].map((m, i) => (
            <button key={m} onClick={() => setMultiplier(multiplier === i + 1 ? 1 : i + 1)} className={`py-3 rounded-xl font-black text-xs transition-all ${multiplier === i + 1 ? 'bg-zinc-100 text-zinc-900 shadow-lg' : 'bg-zinc-800 text-zinc-500'}`}>{m}</button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {dartValues.map(v => (
            <button key={v} onClick={() => handleScoreClick(v)} className="bg-zinc-800 hover:bg-zinc-700 py-2.5 sm:py-4 rounded-xl font-black text-lg sm:text-xl">{v}</button>
          ))}
          <button onClick={() => handleScoreClick(25)} className="bg-zinc-800 hover:bg-zinc-700 py-2.5 sm:py-4 rounded-xl font-black text-lg">25</button>
          <button onClick={() => handleScoreClick(50)} className="bg-red-600/20 text-red-500 py-2.5 sm:py-4 rounded-xl font-black text-base">BULL</button>
          <button onClick={() => handleScoreClick(0)} className="bg-zinc-800/50 text-zinc-500 col-span-2 py-2.5 sm:py-4 rounded-xl font-black text-base">MISS</button>
        </div>
      </div>

      <div className="w-full flex justify-between items-center gap-4">
        <button onClick={undoLastAction} className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 py-3 rounded-xl text-zinc-400 text-[10px] font-black uppercase"><Undo2 size={16} /> Undo</button>
        <button onClick={confirmReset} className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 py-3 rounded-xl text-zinc-400 text-[10px] font-black uppercase"><RotateCcw size={16} /> Reset</button>
      </div>

      <div className="w-full pb-10 overflow-y-auto max-h-[150px] custom-scrollbar">
        {history.map((entry, i) => (
          <div key={i} className="flex justify-between items-center bg-zinc-800/20 p-3 rounded-xl border border-zinc-800/50 mb-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-amber-500 uppercase">{playerNames[entry.player]}</span>
              <span className="font-mono text-xs text-zinc-400">{entry.throws.join(' · ')}</span>
            </div>
            <span className={`font-black text-sm ${entry.isBust ? 'text-red-500' : 'text-amber-500'}`}>{entry.isBust ? 'BUST' : `-${entry.score}`}</span>
          </div>
        ))}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoom-in { from { transform: scale(0.95); } to { transform: scale(1); } }
        @keyframes slide-in-bottom { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-in { animation-fill-mode: forwards; }
        .fade-in { animation-name: fade-in; }
        .zoom-in { animation-name: zoom-in; }
        .slide-in-from-bottom-10 { animation-name: slide-in-bottom; }
      `}</style>
    </div>
  );
};

export default App;
