// Script para criar usuário admin
// Execute: node scripts/create-admin.js

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vjuwmlodwgoagyolpoqz.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Você precisa da service key

if (!supabaseServiceKey) {
  console.log(`
=====================================
INSTRUÇÕES PARA CRIAR USUÁRIO ADMIN
=====================================

Como o Supabase Auth requer autenticação especial para criar usuários,
siga estes passos no Supabase Dashboard:

1. Acesse: https://supabase.com/dashboard/project/vjuwmlodwgoagyolpoqz

2. Vá em Authentication > Users

3. Clique em "Add user" > "Create new user"

4. Preencha:
   - Email: caaus.uniso@gmail.com
   - Password: semanarq
   - Marque "Auto Confirm User"

5. Clique em "Create user"

6. Depois, vá em SQL Editor e execute:

   -- Definir como ADMIN
   UPDATE profiles 
   SET tipo = 'ADMIN', nome = 'CAAUS Admin'
   WHERE email = 'caaus.uniso@gmail.com';

   -- Mudar gui.leitedepaula@hotmail.com para ALUNO
   UPDATE profiles 
   SET tipo = 'ALUNO'
   WHERE email = 'gui.leitedepaula@hotmail.com';

   -- Verificar
   SELECT email, tipo FROM profiles 
   WHERE email IN ('caaus.uniso@gmail.com', 'gui.leitedepaula@hotmail.com');

=====================================
  `);
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdmin() {
  try {
    // Criar usuário no Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: "caaus.uniso@gmail.com",
        password: "semanarq",
        email_confirm: true,
        user_metadata: {
          nome: "CAAUS Admin",
        },
      });

    if (authError) {
      console.error("Erro ao criar usuário:", authError.message);
      return;
    }

    console.log("Usuário criado:", authData.user.id);

    // Atualizar perfil para ADMIN
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ tipo: "ADMIN", nome: "CAAUS Admin" })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Erro ao atualizar perfil:", profileError.message);
      return;
    }

    console.log("Perfil atualizado para ADMIN!");

    // Mudar outro usuário para ALUNO
    const { error: alunoError } = await supabase
      .from("profiles")
      .update({ tipo: "ALUNO" })
      .eq("email", "gui.leitedepaula@hotmail.com");

    if (alunoError) {
      console.error("Erro ao atualizar para ALUNO:", alunoError.message);
    } else {
      console.log("gui.leitedepaula@hotmail.com alterado para ALUNO!");
    }
  } catch (err) {
    console.error("Erro:", err);
  }
}

createAdmin();
