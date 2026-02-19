

## WIFIControl Pro - Sistema de Controle WiFi

### 1. Autenticação e Controle de Acesso
- **Tela de Login** com email e senha, visual limpo com gradiente roxo/indigo
- **Dois perfis de acesso**: Administrador (acesso total) e Equipe Técnica (acesso operacional)
- Administrador pode gerenciar usuários da equipe técnica
- Logout com botão na sidebar

### 2. Dashboard Principal
- Banner de boas-vindas com gradiente
- **4 cards de estatísticas**: Comandos Totais, Dispositivos, Bloqueados e Status WiFi
- **Status do WiFi** com rede principal e rede visitante
- **Ações rápidas**: Modo Pânico (bloquear todos) e Criar WiFi Visitante
- **Atividade Recente** com histórico de ações realizadas no sistema

### 3. Gerenciamento de Dispositivos
- Resumo com contadores: Conectados, Bloqueados, Desconhecidos
- **Lista de dispositivos** com nome, MAC address, IP e status
- Ações por dispositivo: **Bloquear/Desbloquear** e **Renomear**
- Botão de atualizar lista

### 4. Controle via WhatsApp (Simulação)
- **Painel de conversas** à esquerda com lista de contatos
- **Chat simulado** à direita com mensagens enviadas/recebidas
- **Comandos rápidos** como botões: Trocar Senha, WiFi Visitante, Listar Dispositivos, Ajuda
- Respostas automáticas simuladas aos comandos

### 5. Configurações
- **Configurações do WiFi**: Nome da rede (SSID), senha, canal e banda
- **Configurações do Sistema**: PIN de segurança, notificações e bloqueio automático de dispositivos desconhecidos

### 6. Layout e Design
- **Sidebar fixa** à esquerda com navegação entre as páginas
- **Header** com data, indicador de status online e info do usuário logado
- Visual moderno com tons de indigo/roxo, cards com hover suave
- Interface totalmente em **português brasileiro**

### 7. Backend (Supabase)
- Banco de dados para: dispositivos, comandos/atividades, configurações de rede e usuários
- Autenticação via Supabase Auth com controle de roles (admin/técnico)
- Políticas de segurança (RLS) para proteger os dados por perfil de acesso

