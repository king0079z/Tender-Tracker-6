/**
 * Client-side API wrapper for database operations
 */
export class DatabaseAPI {
  private baseUrl: string;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor() {
    this.baseUrl = '/api';
  }

  private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryOperation(operation);
      }
      throw error;
    }
  }

  async query(text: string, params?: any[]) {
    return this.retryOperation(async () => {
      try {
        console.log('Executing query:', { text, params });
        
        const response = await fetch(`${this.baseUrl}/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, params }),
          credentials: 'same-origin'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Database query failed');
        }

        const data = await response.json();
        console.log('Query result:', data);
        
        return {
          rows: data.rows || [],
          rowCount: data.rowCount || 0,
          fields: data.fields || []
        };
      } catch (error) {
        console.error('API query error:', error);
        throw error;
      }
    });
  }
}