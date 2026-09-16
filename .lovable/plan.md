# Edição de ideias pelo colaborador

## Objetivo
Permitir que o autor edite sua própria ideia enquanto ela estiver em **Aguardando avaliação** ou **Aguardando informações**.

## Alterações
- Adicionar, na página de detalhes, uma ação **Editar ideia** visível somente ao autor nos dois estados permitidos.
- Abrir um formulário com título, categoria e descrição preenchidos com os dados atuais.
- Aplicar as mesmas validações usadas no cadastro: título, categoria e descrição obrigatórios, com limites de tamanho.
- Salvar sem alterar o status atual da ideia e atualizar imediatamente os dados exibidos.
- Manter o fluxo separado de **Enviar informações complementares** quando o RH solicitar mais informações; esse envio continuará devolvendo a ideia para avaliação.
- Exibir mensagens claras de sucesso e erro e permitir cancelar a edição.

## Validação
- Confirmar que o botão aparece apenas para o autor nos dois estados permitidos.
- Confirmar que a edição persiste e que o status não muda.
- Confirmar que outros estados e outros usuários não recebem acesso à edição.
- Verificar o fluxo em tela grande e celular.

## Detalhes técnicos
- Reutilizar as categorias ativas e os controles visuais existentes.
- Manter a autorização do banco como barreira final e restringir a atualização aos campos editáveis.
- Registrar a edição no histórico de auditoria.
