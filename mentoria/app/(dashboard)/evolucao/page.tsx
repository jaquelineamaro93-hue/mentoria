'use client';

import { Card } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function EvolucaoPage() {
  const skillsData = [
    { name: 'Liderança', nivel: 6, target: 9, categoria: 'Soft Skills' },
    { name: 'Comunicação', nivel: 7, target: 9, categoria: 'Soft Skills' },
    { name: 'Estratégia', nivel: 5, target: 8, categoria: 'Técnica' },
    { name: 'Delegação', nivel: 4, target: 8, categoria: 'Soft Skills' },
    { name: 'Análise', nivel: 8, target: 9, categoria: 'Técnica' },
  ];

  const progressData = [
    { mes: 'Jun', score: 5 },
    { mes: 'Jul', score: 5.5 },
    { mes: 'Ago', score: 6.2 },
  ];

  const categoriaData = [
    { name: 'Soft Skills', value: 3 },
    { name: 'Técnica', value: 2 },
  ];

  const COLORS = ['#3b82f6', '#8b5cf6'];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sua Evolução</h1>
        <p className="text-gray-600 mt-2">Acompanhe seu progresso nas habilidades de carreira</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-gray-600 text-sm">Nível Médio Geral</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">6.0</p>
          <p className="text-green-600 text-sm mt-1">↑ +1.2 desde junho</p>
        </Card>

        <Card className="p-6">
          <p className="text-gray-600 text-sm">Habilidades em Desenvolvimento</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">5</p>
          <p className="text-gray-600 text-sm mt-1">2 acima da meta</p>
        </Card>

        <Card className="p-6">
          <p className="text-gray-600 text-sm">Consistência</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">87%</p>
          <p className="text-gray-600 text-sm mt-1">Registros completos</p>
        </Card>
      </div>

      {/* Gráfico de Evolução */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Progresso Geral (Últimos 3 Meses)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="mes" stroke="#6b7280" />
            <YAxis stroke="#6b7280" domain={[0, 10]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Habilidades Individuais */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Suas Habilidades</h2>
        <div className="space-y-6">
          {skillsData.map((skill) => (
            <div key={skill.name}>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-900">{skill.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 text-sm">{skill.nivel.toFixed(1)}/10</span>
                  <span className="text-gray-500 text-xs">→ Meta: {skill.target}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${(skill.nivel / 10) * 100}%` }}
                  ></div>
                </div>
                <div className="w-24 h-3 bg-gray-100 rounded-full overflow-hidden border-2 border-dashed border-gray-300">
                  <div
                    className="h-full bg-gray-300 opacity-50"
                    style={{ width: `${(skill.target / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{skill.categoria}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Distribuição por Categoria */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Distribuição de Habilidades</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoriaData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {categoriaData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Próximos Passos */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-4">
          <TrendingUp className="text-blue-600 w-6 h-6 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-blue-900">Sua Trajetória</h3>
            <ul className="text-blue-900 text-sm mt-3 space-y-2">
              <li>✓ Delegação é sua maior oportunidade de crescimento</li>
              <li>✓ Análise é um ponto forte, continue investindo</li>
              <li>→ Próxima meta: Elevar Liderança para 7.5 em setembro</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
