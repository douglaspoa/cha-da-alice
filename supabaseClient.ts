
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uifkubiaeinwmegnsuno.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZmt1YmlhZWlud21lZ25zdW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjc3MTQsImV4cCI6MjA2NTk0MzcxNH0.qT8zA6rjTJsWhV8yzc9dKDL1cmcrgJWwTbYBwY65V98';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
