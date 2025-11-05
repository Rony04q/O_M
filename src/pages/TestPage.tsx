// src/pages/TestPage.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // Our client
import { AuthError, Session } from '@supabase/supabase-js'; // Import types

// Define the shape of the successful response from getSession
type SupabaseSessionResponse = {
  data: { session: Session | null };
  error: AuthError | null;
}

export default function TestPage() {
  const [message, setMessage] = useState('Testing Supabase connection...');

  useEffect(() => {
    const testConnection = async () => {
      console.log('TestPage: Attempting supabase.auth.getSession()');
      
      try {
        // We add a 10-second timeout
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timed out after 10 seconds')), 10000)
          )
        ]) as SupabaseSessionResponse; // Cast the successful result

        // Now we can safely destructure
        const { data, error } = result;
        
        if (error) {
          console.error('TestPage Error:', error.message);
          setMessage(`Test FAILED: ${error.message}`);
        } else if (data.session) {
          console.log('TestPage Success:', data.session);
          setMessage('Test SUCCESS! Found a user session.');
        } else {
          console.log('TestPage OK: No user session, but connection worked.');
          setMessage('Test OK. Connection successful, but no user is logged in.');
        }

      } catch (err: any) { // The timeout error will be caught here
        console.error('TestPage CATCH Error:', err.message);
        setMessage(`Test FAILED (Catch): ${err.message}`);
      }
    };

    testConnection(); // Run the test
  }, []); // Run only once

  return (
    <div style={{ padding: '50px', fontSize: '24px' }}>
      <h1>Supabase Connection Test</h1>
      <p>{message}</p>
    </div>
  );
}