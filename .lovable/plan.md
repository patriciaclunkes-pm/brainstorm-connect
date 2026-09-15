# Espaço Aberto — Portal de Ideias (V1)

Portal interno onde colaboradores registram ideias e o RH avalia, responde e acompanha tudo em um só lugar.

## Decisões já confirmadas

- Entrada com e-mail e senha.
- Somente o administrador cria contas (não há autocadastro).
- Equipes, líderes e alocação de pessoas são cadastrados pelo administrador.
- Notificações apenas dentro do portal (sem e-mail nesta entrega).
- Anexos ficam para uma etapa futura.
- Status: Aguardando avaliação, Em avaliação, Aguardando informações, Aprovada, Em roadmap, Recusada, Implementada.
- O colaborador pode editar a ideia enquanto ela está "Aguardando avaliação" ou "Aguardando informações".

## Ponto de partida

Como ninguém pode se cadastrar sozinho, o primeiro administrador é criado junto com a base de dados, com e-mail e senha iniciais que você troca no primeiro acesso. A partir dele, todas as outras contas são criadas dentro do portal.

## O que será construído

**1. Entrada e contas**
Tela de login, troca de senha e saída. Cada pessoa tem nome, e-mail, equipe e perfil (Administrador, RH, Líder ou Colaborador).

**2. Administração**
- Pessoas: criar, editar, definir perfil e equipe, desativar.
- Equipes: criar, editar, indicar o líder.
- Categorias: criar, editar e inativar (categoria inativa some do formulário, mas continua nas ideias antigas).

**3. Colaborador**
- Painel com contadores (total, em avaliação, aprovadas, pendentes de ação) e avisos de pendência.
- "Nova ideia": título, descrição e categoria, todos obrigatórios.
- Lista das próprias ideias com busca por título, filtro por status e por data, e ordenação.
- Detalhe da ideia com linha do tempo de cada mudança de status, autor da avaliação e parecer.
- Quando o RH pede complemento, aparece um aviso e um campo para responder; ao enviar, a ideia volta para "Em avaliação".

**4. RH e Administrador**
- Painel com todas as ideias da organização, contadores por status e tempo médio de resposta.
- Filtros por período, equipe, categoria e status.
- Abrir uma ideia em fila muda o status para "Em avaliação".
- Mudança de status com parecer; recusa exige justificativa (sem ela, o sistema bloqueia).
- Somente o administrador pode editar ou excluir registros.

**5. Líder de equipe**
- Lista somente as ideias das pessoas da sua equipe, em modo leitura, com acesso ao detalhe e à linha do tempo.

**6. Segurança e auditoria**
- Cada perfil só enxerga o que lhe cabe, com a regra aplicada no próprio banco de dados, não apenas na tela.
- Toda exclusão, edição e mudança de status fica registrada em um histórico de auditoria.

## Visual

Interface corporativa sóbria e clara, em português, com cores de status consistentes, boa leitura em celular e navegador, e páginas que carregam rápido.

## Detalhes técnicos

- Lovable Cloud (banco, autenticação e regras de acesso).
- Tabelas: `profiles`, `equipes`, `user_roles` (perfis em tabela separada, com função `has_role`), `categorias`, `ideias`, `historico_tramitacoes`, `notificacoes`, `audit_logs`.
- Políticas de acesso por linha: colaborador vê `autor_id = auth.uid()`; líder vê ideias cuja `equipe_id` é a equipe que lidera; RH e Admin veem tudo; escrita de status restrita a RH/Admin.
- Transições de status validadas no servidor, incluindo obrigatoriedade de `motivo_recusa`.
- Rotas protegidas sob `_authenticated`; painel do RH e administração também checam o perfil.
- Histórico e notificações gerados por gatilho no banco a cada mudança de status.

## Fora desta entrega

Reclamações, denúncias, anonimato, gamificação, SSO, aplicativo móvel, anexos e envio de e-mails.
