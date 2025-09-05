import { supabase, TABLES, handleSupabaseError } from '../utils/supabaseClient';

export class TradingService {
  // Create a new trade
  static async createTrade(tradeData) {
    try {
      const trade = {
        user_id: tradeData.userId,
        symbol: tradeData.symbol,
        type: tradeData.type, // 'buy' or 'sell'
        quantity: tradeData.quantity,
        entry_price: tradeData.entryPrice,
        exit_price: tradeData.exitPrice || null,
        profit_loss: tradeData.profitLoss || null,
        status: tradeData.status || 'open', // 'open', 'closed'
        feedback: tradeData.feedback || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(TABLES.TRADES)
        .insert([trade])
        .select()
        .single();

      if (error) throw error;
      return { trade: data, error: null };
    } catch (error) {
      return { trade: null, error: handleSupabaseError(error, 'Create Trade') };
    }
  }

  // Get user's trade history
  static async getUserTrades(userId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from(TABLES.TRADES)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { trades: data, error: null };
    } catch (error) {
      return { trades: [], error: handleSupabaseError(error, 'Get User Trades') };
    }
  }

  // Update trade (for closing positions)
  static async updateTrade(tradeId, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.TRADES)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId)
        .select()
        .single();

      if (error) throw error;
      return { trade: data, error: null };
    } catch (error) {
      return { trade: null, error: handleSupabaseError(error, 'Update Trade') };
    }
  }

  // Close a trade
  static async closeTrade(tradeId, exitPrice) {
    try {
      // First get the trade to calculate profit/loss
      const { data: trade, error: fetchError } = await supabase
        .from(TABLES.TRADES)
        .select('*')
        .eq('id', tradeId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate profit/loss
      const profitLoss = trade.type === 'buy' 
        ? (exitPrice - trade.entry_price) * trade.quantity
        : (trade.entry_price - exitPrice) * trade.quantity;

      // Update the trade
      const { data, error } = await supabase
        .from(TABLES.TRADES)
        .update({
          exit_price: exitPrice,
          profit_loss: profitLoss,
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId)
        .select()
        .single();

      if (error) throw error;
      return { trade: data, error: null };
    } catch (error) {
      return { trade: null, error: handleSupabaseError(error, 'Close Trade') };
    }
  }

  // Create a position (open trade)
  static async createPosition(positionData) {
    try {
      const position = {
        user_id: positionData.userId,
        trade_id: positionData.tradeId,
        symbol: positionData.symbol,
        type: positionData.type,
        quantity: positionData.quantity,
        entry_price: positionData.entryPrice,
        current_price: positionData.currentPrice || positionData.entryPrice,
        unrealized_pnl: 0,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(TABLES.POSITIONS)
        .insert([position])
        .select()
        .single();

      if (error) throw error;
      return { position: data, error: null };
    } catch (error) {
      return { position: null, error: handleSupabaseError(error, 'Create Position') };
    }
  }

  // Get user's open positions
  static async getUserPositions(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.POSITIONS)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { positions: data, error: null };
    } catch (error) {
      return { positions: [], error: handleSupabaseError(error, 'Get User Positions') };
    }
  }

  // Update position with current price
  static async updatePosition(positionId, currentPrice) {
    try {
      // First get the position to calculate unrealized P&L
      const { data: position, error: fetchError } = await supabase
        .from(TABLES.POSITIONS)
        .select('*')
        .eq('id', positionId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate unrealized P&L
      const unrealizedPnl = position.type === 'buy'
        ? (currentPrice - position.entry_price) * position.quantity
        : (position.entry_price - currentPrice) * position.quantity;

      const { data, error } = await supabase
        .from(TABLES.POSITIONS)
        .update({
          current_price: currentPrice,
          unrealized_pnl: unrealizedPnl,
          updated_at: new Date().toISOString()
        })
        .eq('id', positionId)
        .select()
        .single();

      if (error) throw error;
      return { position: data, error: null };
    } catch (error) {
      return { position: null, error: handleSupabaseError(error, 'Update Position') };
    }
  }

  // Close a position
  static async closePosition(positionId, exitPrice) {
    try {
      const { data, error } = await supabase
        .from(TABLES.POSITIONS)
        .update({
          exit_price: exitPrice,
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', positionId)
        .select()
        .single();

      if (error) throw error;
      return { position: data, error: null };
    } catch (error) {
      return { position: null, error: handleSupabaseError(error, 'Close Position') };
    }
  }

  // Get trading statistics for a user
  static async getTradingStats(userId, timeframe = '30d') {
    try {
      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      const { data, error } = await supabase
        .from(TABLES.TRADES)
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate statistics
      const totalTrades = data.length;
      const closedTrades = data.filter(trade => trade.status === 'closed');
      const totalProfitLoss = closedTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
      const winningTrades = closedTrades.filter(trade => (trade.profit_loss || 0) > 0);
      const losingTrades = closedTrades.filter(trade => (trade.profit_loss || 0) < 0);
      
      const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
      const avgWin = winningTrades.length > 0 
        ? winningTrades.reduce((sum, trade) => sum + trade.profit_loss, 0) / winningTrades.length 
        : 0;
      const avgLoss = losingTrades.length > 0 
        ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profit_loss, 0) / losingTrades.length)
        : 0;

      const stats = {
        timeframe,
        total_trades: totalTrades,
        closed_trades: closedTrades.length,
        open_trades: totalTrades - closedTrades.length,
        total_profit_loss: totalProfitLoss,
        winning_trades: winningTrades.length,
        losing_trades: losingTrades.length,
        win_rate: winRate,
        average_win: avgWin,
        average_loss: avgLoss,
        profit_factor: avgLoss > 0 ? avgWin / avgLoss : 0,
        trades: data
      };

      return { stats, error: null };
    } catch (error) {
      return { stats: null, error: handleSupabaseError(error, 'Get Trading Stats') };
    }
  }

  // Delete a trade (admin function)
  static async deleteTrade(tradeId) {
    try {
      const { error } = await supabase
        .from(TABLES.TRADES)
        .delete()
        .eq('id', tradeId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: handleSupabaseError(error, 'Delete Trade') };
    }
  }
}
