import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  numeric,
  varchar,
  serial
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Usuários (Mentorados)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  package: varchar('package', { length: 50 }).notNull(), // 'starter', 'standard', 'premium'
  sessionType: varchar('session_type', { length: 50 }).notNull(), // 'presencial', 'online', 'hibrido'
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Encontros (Sessões de Mentoria)
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'presencial', 'online', 'grupo'
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  link: varchar('link', { length: 500 }), // Para sessões online
  location: varchar('location', { length: 255 }), // Para presenciais
  completed: boolean('completed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Exercícios: Mapa de Quem Sou Eu (9 perguntas SOMA)
export const mapExercises = pgTable('map_exercises', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  // 9 Blocos do Mapa
  values: jsonb('values'), // Bloco 1: Valores e Crenças
  powerMoments: jsonb('power_moments'), // Bloco 2: Momentos de Potência
  woundsToStrength: jsonb('wounds_to_strength'), // Bloco 3: Feridas que viraram Força
  cycles: jsonb('cycles'), // Bloco 4: Ciclos e Energia
  forgottenCalls: jsonb('forgotten_calls'), // Bloco 5: Chamados Esquecidos
  contribution: jsonb('contribution'), // Bloco 6: Contribuição
  passions: jsonb('passions'), // Bloco 7: Paixões
  skills: jsonb('skills'), // Bloco 8: Conhecimentos e Habilidades
  currentPresence: jsonb('current_presence'), // Bloco 9: Presença Atual
  completed: boolean('completed').default(false),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Exercícios: Teste de Personalidade (Carreira)
export const personalityTests = pgTable('personality_tests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  // Testes com categorias de carreira
  responses: jsonb('responses').notNull(), // { questionId: answer, ... }
  results: jsonb('results').notNull(), // { profileType: string, scores: {...} }
  profileType: varchar('profile_type', { length: 100 }).notNull(), // Ex: 'Inovador', 'Estrategista', etc
  description: text('description'),
  recommendations: jsonb('recommendations'), // Recomendações de carreira baseadas no profile
  completedAt: timestamp('completed_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Diário de Bordo
export const diaryEntries = pgTable('diary_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  sessionId: integer('session_id').references(() => sessions.id),
  content: text('content').notNull(),
  insights: jsonb('insights'), // Análise IA de insights
  tags: jsonb('tags'), // ['liderança', 'estratégia', ...] para categorizar
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Habilidades e Evolução
export const skillsProgress = pgTable('skills_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  skillName: varchar('skill_name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(), // 'liderança', 'técnica', 'comunicação', etc
  currentLevel: numeric('current_level', { precision: 3, scale: 1 }).default('1'), // 1-10
  targetLevel: numeric('target_level', { precision: 3, scale: 1 }),
  history: jsonb('history'), // Array de { date, level, note }
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Pontos e Gamificação
export const pointsBalance = pgTable('points_balance', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).unique().notNull(),
  totalPoints: integer('total_points').default(0),
  availablePoints: integer('available_points').default(0),
  redeemedPoints: integer('redeemed_points').default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Achievements / Passaporte
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }), // Nome do ícone/emoji
  category: varchar('category', { length: 100 }).notNull(), // 'completion', 'consistency', 'growth', 'community'
  pointsReward: integer('points_reward').default(0),
  unlockedAt: timestamp('unlocked_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Transações de Pontos (Histórico)
export const pointsTransactions = pgTable('points_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'earn', 'redeem'
  amount: integer('amount').notNull(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Loja de Pontos - Itens disponíveis
export const rewardsShop = pgTable('rewards_shop', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  cost: integer('cost').notNull(),
  category: varchar('category', { length: 100 }).notNull(), // 'sessao', 'recurso', 'consultoria', 'badge'
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Resgate de Recompensas
export const rewardsRedeemed = pgTable('rewards_redeemed', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  rewardId: integer('reward_id').references(() => rewardsShop.id).notNull(),
  pointsSpent: integer('points_spent').notNull(),
  redeemedAt: timestamp('redeemed_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  mapExercises: many(mapExercises),
  personalityTests: many(personalityTests),
  diaryEntries: many(diaryEntries),
  skillsProgress: many(skillsProgress),
  achievements: many(achievements),
  pointsTransactions: many(pointsTransactions),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  diaryEntries: many(diaryEntries),
}));

export const mapExercisesRelations = relations(mapExercises, ({ one }) => ({
  user: one(users, {
    fields: [mapExercises.userId],
    references: [users.id],
  }),
}));

export const diaryEntriesRelations = relations(diaryEntries, ({ one }) => ({
  user: one(users, {
    fields: [diaryEntries.userId],
    references: [users.id],
  }),
  session: one(sessions, {
    fields: [diaryEntries.sessionId],
    references: [sessions.id],
  }),
}));
