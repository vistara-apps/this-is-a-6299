import { supabase, TABLES, handleSupabaseError } from '../utils/supabaseClient';

export class UserService {
  // Create user profile after authentication
  static async createUserProfile(userId, userData) {
    try {
      const userProfile = {
        id: userId,
        username: userData.username || `Trader${Math.floor(Math.random() * 1000)}`,
        email: userData.email,
        subscription_tier: userData.subscription_tier || 'free',
        virtual_balance: userData.virtual_balance || 10000,
        total_profit_loss: 0,
        tutorial_progress: {},
        completed_scenarios: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .insert([userProfile])
        .select()
        .single();

      if (error) throw error;
      return { user: data, error: null };
    } catch (error) {
      return { user: null, error: handleSupabaseError(error, 'Create User Profile') };
    }
  }

  // Get user profile by ID
  static async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { user: data, error: null };
    } catch (error) {
      return { user: null, error: handleSupabaseError(error, 'Get User Profile') };
    }
  }

  // Update user profile
  static async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { user: data, error: null };
    } catch (error) {
      return { user: null, error: handleSupabaseError(error, 'Update User Profile') };
    }
  }

  // Update virtual balance
  static async updateVirtualBalance(userId, newBalance) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({
          virtual_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { user: data, error: null };
    } catch (error) {
      return { user: null, error: handleSupabaseError(error, 'Update Virtual Balance') };
    }
  }

  // Update subscription tier
  static async updateSubscriptionTier(userId, tier) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({
          subscription_tier: tier,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { user: data, error: null };
    } catch (error) {
      return { user: null, error: handleSupabaseError(error, 'Update Subscription Tier') };
    }
  }

  // Update tutorial progress
  static async updateTutorialProgress(userId, tutorialId, completed = true) {
    try {
      // First get current progress
      const { data: currentUser, error: fetchError } = await supabase
        .from(TABLES.USERS)
        .select('tutorial_progress')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const updatedProgress = {
        ...currentUser.tutorial_progress,
        [tutorialId]: completed
      };

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({
          tutorial_progress: updatedProgress,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { user: data, error: null };
    } catch (error) {
      return { user: null, error: handleSupabaseError(error, 'Update Tutorial Progress') };
    }
  }

  // Add completed scenario
  static async addCompletedScenario(userId, scenarioId) {
    try {
      // First get current scenarios
      const { data: currentUser, error: fetchError } = await supabase
        .from(TABLES.USERS)
        .select('completed_scenarios')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const completedScenarios = currentUser.completed_scenarios || [];
      if (!completedScenarios.includes(scenarioId)) {
        completedScenarios.push(scenarioId);
      }

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({
          completed_scenarios: completedScenarios,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { user: data, error: null };
    } catch (error) {
      return { user: null, error: handleSupabaseError(error, 'Add Completed Scenario') };
    }
  }

  // Get user statistics
  static async getUserStats(userId) {
    try {
      // Get user profile
      const { data: user, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get trade count and performance
      const { data: trades, error: tradesError } = await supabase
        .from(TABLES.TRADES)
        .select('profit_loss, created_at')
        .eq('user_id', userId);

      if (tradesError) throw tradesError;

      // Calculate statistics
      const totalTrades = trades.length;
      const totalProfitLoss = trades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
      const winningTrades = trades.filter(trade => (trade.profit_loss || 0) > 0).length;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

      const stats = {
        ...user,
        total_trades: totalTrades,
        total_profit_loss: totalProfitLoss,
        winning_trades: winningTrades,
        win_rate: winRate,
        completed_tutorials: Object.keys(user.tutorial_progress || {}).length,
        completed_scenarios_count: (user.completed_scenarios || []).length
      };

      return { stats, error: null };
    } catch (error) {
      return { stats: null, error: handleSupabaseError(error, 'Get User Stats') };
    }
  }

  // Delete user profile (for GDPR compliance)
  static async deleteUserProfile(userId) {
    try {
      const { error } = await supabase
        .from(TABLES.USERS)
        .delete()
        .eq('id', userId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: handleSupabaseError(error, 'Delete User Profile') };
    }
  }
}
