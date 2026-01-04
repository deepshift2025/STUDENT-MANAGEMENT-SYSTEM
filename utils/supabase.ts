
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixbcrtzfchyltxtytvzo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4YmNydHpmY2h5bHR4dHl0dnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwODg1MTcsImV4cCI6MjA3NzY2NDUxN30.iXqEPR7jTCq4udnzNn_xB8KzNN7cnjP83a0AUYNmmzI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
