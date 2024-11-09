'use client';

import { useState } from 'react';

export default function TextRephraser() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRephrase = async () => {
    const text = input.trim();
    
    if (!text) {
      setError('Please enter some text to rephrase');
      return;
    }

    try {
      setError('');
      setIsLoading(true);

      const response = await fetch('/api/rephrase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to rephrase text');
      }

      setResult(data.rephrased);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Text Rephraser</h1>
      
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter text to rephrase..."
        className="w-full h-36 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      
      <button
        onClick={handleRephrase}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Rephrasing...' : 'Rephrase Text'}
      </button>
      
      {error && (
        <div className="p-3 text-red-500 bg-red-50 rounded-lg">
          {error}
        </div>
      )}
      
      {result && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">Rephrased Text:</h2>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}