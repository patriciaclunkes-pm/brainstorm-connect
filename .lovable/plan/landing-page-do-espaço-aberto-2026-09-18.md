# Landing page do Espaço Aberto

## Objetivo
Criar uma página pública de apresentação corporativa em português, com visual acolhedor, moderno e confiável, preservando o acesso seguro já existente ao portal.

## O que será alterado
- Transformar a página inicial (`/`) na apresentação do Espaço Aberto, com destaque principal, selo institucional e botão para acesso.
- Mover a tela de entrada existente para `/login`, sem alterar autenticação, permissões ou regras do portal.
- Adicionar as seções “O que é”, benefícios, “Como funciona”, citação e chamada final solicitadas.
- Atualizar saídas e redirecionamentos de acesso para apontarem à nova página de login quando necessário.
- Aplicar a paleta azul e verde existente de forma mais expressiva, com cartões leves, ícones consistentes e animações discretas que respeitem redução de movimento.
- Garantir boa leitura e organização em celulares e telas maiores.
- Atualizar títulos e descrições de compartilhamento das páginas pública e de login.

## Detalhes técnicos
- Criar uma rota pública dedicada em `/login` reaproveitando integralmente o formulário atual.
- Usar componentes, cores semânticas e tipografia já disponíveis no projeto.
- Manter a página exclusivamente informativa, sem novos formulários ou alterações no banco.
- Validar navegação entre apresentação, login e área autenticada, além da visualização em desktop e celular.
