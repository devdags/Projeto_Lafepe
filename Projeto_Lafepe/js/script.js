document.addEventListener('DOMContentLoaded', () => {
  fetch('/materia_prima_vencida')
    .then(response => response.json())
    .then(data => {
      if (data.length === 0) {
        console.warn('Nenhum dado de matéria-prima vencida encontrado.');
      }

      const tabelaBody = document.getElementById('tabela-body');
      let totalQuantidade = 0;
      let totalValor = 0;

      data.forEach(item => {
        totalQuantidade += item.quantidade;
        totalValor += parseFloat(item.valorTotal);

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.nome}</td>
          <td>${item.produto_id}</td>
          <td>${item.quantidade}</td>
          <td>${parseFloat(item.valorTotal).toFixed(2)}</td>
        `;
        tabelaBody.appendChild(row);
      });

      document.getElementById('total-quantidade').innerText = totalQuantidade;
      document.getElementById('total-valor').innerText = totalValor.toFixed(2);
    })
    .catch(error => {
      console.error('Erro ao carregar dados de matéria-prima vencida:', error);
    });
});

document.getElementById('loginForm').addEventListener('submit', function(event) {
  event.preventDefault();
  
  const usuario = document.getElementById('usuario').value;
  const senha = document.getElementById('senha').value;
  const message = document.getElementById('message');

  if (usuario === 'admin' && senha === 'admin') {
    window.location.href = 'menu.html';
  } else {
    message.textContent = 'Você não tem acesso, solicite a senha a um supervisor.';
  }
});
