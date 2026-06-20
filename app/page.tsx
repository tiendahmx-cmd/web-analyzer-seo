'use client';
import { useState } from 'react';

export default function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([
    { id: '1', title: 'Tarea inicial de ejemplo', aiSolution: 'Esta es una tarea de prueba para mostrar la interfaz.', status: 'pending' }
  ]);
  const [loading, setLoading] = useState(false);
  const licenseToken = 'TOKEN_DE_PRUEBA_123';

  const testAI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/wordpress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-license-token': licenseToken
        },
        body: JSON.stringify({
          title: 'Beneficios del Marketing Digital',
          content: 'El marketing digital es importante.',
          focusKeyword: 'marketing digital'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`El servidor respondió: ${errorText}`);
      }

      const data = await response.json();
      if (data.tasks) {
        const newTasks = data.tasks.map((t: any) => ({ ...t, id: Math.random().toString() }));
        setTasks([...newTasks]);
      } else {
        throw new Error(data.error || 'Formato desconocido');
      }
    } catch (error: any) {
      alert('Error detallado: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '32px', fontFamily: 'Arial, sans-serif', color: '#333' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>Dashboard SEO</h1>
            <p style={{ color: '#6b7280', margin: '5px 0 0' }}>Análisis de: <span style={{ fontWeight: '600', color: '#2563eb' }}>misitio.com</span></p>
          </div>
          <button 
            onClick={testAI} 
            disabled={loading}
            style={{ background: '#8b5cf6', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? 'Pensando...' : '🤖 Probar IA'}
          </button>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 24px 0' }}>Tareas de Optimización IA</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {tasks.map((task) => (
              <div key={task.id} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <h3 style={{ fontWeight: '500', margin: '0 0 4px 0', color: '#333' }}>{task.title}</h3>
                <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>{task.aiSolution}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}