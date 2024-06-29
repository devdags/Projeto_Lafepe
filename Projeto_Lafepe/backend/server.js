const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mysql = require('mysql2');
const authRoutes = require('./routes/auth');
const path = require('path');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'mySecret',
  resave: false,
  saveUninitialized: true
}));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234*', 
  database: 'estoque_db'
});

db.connect(err => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conectado ao banco de dados MySQL.');
});


app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/paginas', express.static(path.join(__dirname, '../paginas')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/produto/:name', (req, res) => {
  const nome = req.params.name;
  console.log(`Buscando produto: ${nome}`);
  
  const query = 'SELECT * FROM produtos WHERE nome = ?';
  db.query(query, [nome], (err, results) => {
    if (err) {
      console.error('Erro ao buscar os detalhes do produto:', err);
      res.status(500).json({ message: 'Erro ao buscar os detalhes do produto' });
      return;
    }
    
    console.log('Resultados da consulta:', results);

    if (results.length > 0) {
      res.json(results);
    } else {
      res.status(404).json({ message: 'Produto não encontrado' });
    }
  });
});


app.get('/materia_prima/:name', (req, res) => {
  const nome = req.params.name;
  console.log(`Buscando matéria-prima: ${nome}`);

  const query = 'SELECT * FROM materia_prima WHERE nome = ?';
  db.query(query, [nome], (err, results) => {
    if (err) {
      console.error('Erro ao buscar os detalhes da matéria-prima:', err);
      res.status(500).json({ message: 'Erro ao buscar os detalhes da matéria-prima' });
      return;
    }

    console.log('Resultados da consulta:', results);

    if (results.length > 0) {
      res.json(results); 
    } else {
      res.status(404).json({ message: 'Matéria-prima não encontrada' });
    }
  });
});

app.get('/materiais_embalagem_primaria/:name', (req, res) => {
  const nome = req.params.name;
  console.log(`Buscando material de embalagem primária: ${nome}`);

  const query = 'SELECT * FROM material_embalagem_primaria WHERE nome = ?';
  db.query(query, [nome], (error, results) => {
    if (error) {
      console.error('Erro ao buscar o material de embalagem primária:', error);
      res.status(500).json({ error: 'Erro ao buscar o material de embalagem primária' });
    } else {
      if (results.length === 0) {
        res.json({ message: 'Material não encontrado' });
      } else {
        res.json(results);
      }
    }
  });
});

app.get('/material_embalagem_secundaria/:name', (req, res) => {
  const nome = req.params.name;
  console.log(`Buscando material de embalagem secundária: ${nome}`);

  const query = 'SELECT * FROM material_embalagem_secundaria WHERE nome = ?';
  db.query(query, [nome], (err, results) => {
    if (err) {
      console.error('Erro ao buscar os detalhes do material de embalagem secundária:', err);
      res.status(500).json({ message: 'Erro ao buscar os detalhes do material de embalagem secundária' });
      return;
    }

    console.log('Resultados da consulta:', results);

    if (results.length > 0) {
      res.json(results); 
    } else {
      res.status(404).json({ message: 'Material de embalagem secundária não encontrado' });
    }
  });
});

app.post('/nova_aquisicao', (req, res) => {
  const { nome, produto_id, data_aquisicao, data_fabricacao, data_validade, data_chegada, quantidade, valor_total } = req.body;

  const validNames = [
    '02254', '02261', '02298', '02301', '02307', '02314', '02325', '02391', '02392', '02013', 
    '02016', '02020', '02022', '02058', '02068', '02074', '02108', '02119', '02188', '02232', 
    '02242', '02266', '02297', '02302', '02303', '02304', '02305', '02306', '02309', '02311', 
    '02315', '02326', '02330', '02332', '02333', '02377', '02378', '02399', '02400', '11816', 
    '11818', '11842', '11813', '11843', '11876', '11877', '11888', '11886', '11887', '11885', 
    '11875', '11819', '11906', '11904', '11909', '11958', '11959', '11396', '11795', '11796', 
    '11797', '11808', '11922', '11580', '11845', '11856', '11921', '11854', '11844', '11853', 
    '11869', '11872', '11895', '11870', '11894', '11867', '11873', '11897', '11868', '11893', 
    '11871', '11892', '11744', '11747', '11940', '11951', '11908', '11937', '11938', '11939', 
    '11687', '11911', '11912', '11913', '11910'
  ];

  if (!validNames.includes(nome)) {
    return res.json({ success: false, message: 'Nome inválido.' });
  }

  if (produto_id.length !== 10 || !/^\d{10}$/.test(produto_id)) {
    return res.json({ success: false, message: 'ID do Produto deve conter exatamente 10 números.' });
  }

  if (valor_total < 0) {
    return res.json({ success: false, message: 'O valor total não pode ser negativo.' });
  }

  const queryCheckId = 'SELECT * FROM aquisicoes WHERE produto_id = ?';
  db.query(queryCheckId, [produto_id], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      return res.json({ success: false, message: 'ID duplicado. Cada nome deve ter um ID único.' });
    }

    const queryInsert = 'INSERT INTO aquisicoes (nome, produto_id, data_aquisicao, data_fabricacao, data_validade, data_chegada, quantidade, valor_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(queryInsert, [nome, produto_id, data_aquisicao, data_fabricacao, data_validade, data_chegada, quantidade, valor_total], (err, result) => {
      if (err) throw err;

      res.json({ success: true, message: 'Nova aquisição cadastrada com sucesso!' });
    });
  });
});

app.get('/pre_estoque', (req, res) => {
  const query = 'SELECT * FROM aquisicoes';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar os dados do pré-estoque:', err);
      res.status(500).json({ message: 'Erro ao buscar os dados do pré-estoque' });
      return;
    }
    res.json(results);
  });
});

app.get('/pre_estoque', (req, res) => {
  const query = 'SELECT * FROM aquisicoes';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar os dados do pré-estoque:', err);
      res.status(500).json({ message: 'Erro ao buscar os dados do pré-estoque' });
      return;
    }
    res.json(results);
  });
});

app.post('/mover_para_quarentena', (req, res) => {
  const { id, nome } = req.query;
  const currentDate = new Date().toISOString().slice(0, 10);

  const quarentena_mp_nomes = ['02254', '02261', '02298', '02301', '02307', '02314', '02325', '02391', '02392', '02013', 
    '02016', '02020', '02022', '02058', '02068', '02074', '02108', '02119', '02188', '02232', '02242', '02266', '02297', 
    '02302', '02303', '02304', '02305', '02306', '02309', '02311', '02315', '02326', '02330', '02332', '02333', '02377', 
    '02378', '02399', '02400'];

  const quarentena_me_nomes = ['11816', '11818', '11842', '11813', '11843', '11876', '11877', '11888', '11886', '11887', 
    '11885', '11875', '11819', '11906', '11904', '11909', '11958', '11959', '11396', '11795', '11796', '11797', '11808', 
    '11922', '11580', '11845', '11856', '11921', '11854', '11844', '11853', '11869', '11872', '11895', '11870', '11894', 
    '11867', '11873', '11897', '11868', '11893', '11871', '11892', '11744', '11747', '11940', '11951', '11908', '11937', 
    '11938', '11939', '11687', '11911', '11912', '11913', '11910'];

  const tableName = quarentena_mp_nomes.includes(nome) ? 'quarentena_mp' :
                    quarentena_me_nomes.includes(nome) ? 'quarentena_me' : null;

  if (!tableName) {
    res.status(400).json({ success: false, message: 'Nome do produto não corresponde a nenhuma tabela de quarentena.' });
    return;
  }

  const query = 'SELECT * FROM aquisicoes WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Erro ao buscar os dados do item:', err);
      res.status(500).json({ message: 'Erro ao buscar os dados do item' });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ message: 'Item não encontrado.' });
      return;
    }

    const item = results[0];

    const insertQuery = `INSERT INTO ${tableName} (nome, produto_id, data_aquisicao, data_fabricacao, data_validade, data_chegada, quantidade, valor_total, data_entrada, data_saida, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 'Pendente')`;
    const insertValues = [item.nome, item.produto_id, item.data_aquisicao, item.data_fabricacao, item.data_validade, item.data_chegada, item.quantidade, item.valor_total];

    db.query(insertQuery, insertValues, (err, result) => {
      if (err) {
        console.error('Erro ao inserir o item na tabela de quarentena:', err);
        res.status(500).json({ message: 'Erro ao inserir o item na tabela de quarentena' });
        return;
      }

      const deleteQuery = 'DELETE FROM aquisicoes WHERE id = ?';
      db.query(deleteQuery, [id], (err, result) => {
        if (err) {
          console.error('Erro ao deletar o item da tabela de aquisições:', err);
          res.status(500).json({ message: 'Erro ao deletar o item da tabela de aquisições' });
          return;
        }

        res.json({ success: true, message: 'Item movido para a quarentena com sucesso.' });
      });
    });
  });
});

app.get('/quarentena_me', (req, res) => {
  const query = 'SELECT * FROM quarentena_me WHERE status = "Pendente"';

  db.query(query, (err, result) => {
    if (err) {
      console.error('Erro ao obter dados da quarentena:', err);
      res.status(500).json({ success: false, message: 'Erro ao obter dados da quarentena' });
      return;
    }

    res.json(result); 
  });
});

app.get('/quarentena_me/:produtoId', (req, res) => {
  const produtoId = req.params.produtoId;

  const selectQuery = 'SELECT * FROM quarentena_me WHERE produto_id = ?';
  db.query(selectQuery, produtoId, (err, result) => {
    if (err) {
      console.error('Erro ao buscar dados da quarentena:', err);
      res.status(500).json({ success: false, message: 'Erro ao buscar dados da quarentena' });
      return;
    }

    if (result.length === 0) {
      res.status(404).json({ success: false, message: 'Item da quarentena não encontrado' });
      return;
    }

    res.json(result[0]); 
  });
});


const nomesPrimaria = [
  '11816', '11818', '11842', '11813', '11843', '11876', '11877', '11888',
  '11886', '11887', '11885', '11875', '11819', '11906', '11904', '11909',
  '11958', '11959'
];

const nomesSecundaria = [
  '11396', '11795', '11796', '11797', '11808', '11922', '11580', '11845',
  '11856', '11921', '11854', '11844', '11853', '11869', '11872', '11895',
  '11870', '11894', '11867', '11873', '11897', '11868', '11893', '11871',
  '11892', '11744', '11747', '11940', '11951', '11908', '11937', '11938',
  '11939', '11687', '11911', '11912', '11913', '11910'
];

app.post('/quarentena_me/:produtoId', (req, res) => {
  const produtoId = req.params.produtoId;
  const { data_entrada, data_saida, status } = req.body;

  const updateQuery = 'UPDATE quarentena_me SET data_entrada = ?, data_saida = ?, status = ? WHERE produto_id = ?';
  db.query(updateQuery, [data_entrada, data_saida, status, produtoId], (err, result) => {
    if (err) {
      console.error('Erro ao atualizar os dados da quarentena:', err);
      res.status(500).json({ success: false, message: 'Erro ao atualizar os dados da quarentena' });
      return;
    }

    if (status !== 'Pendente') {
      const selectQuery = 'SELECT * FROM quarentena_me WHERE produto_id = ?';
      db.query(selectQuery, [produtoId], (err, rows) => {
        if (err) {
          console.error('Erro ao selecionar dados da quarentena:', err);
          res.status(500).json({ success: false, message: 'Erro ao selecionar dados da quarentena' });
          return;
        }

        if (rows.length === 0) {
          res.status(404).json({ success: false, message: 'Item da quarentena não encontrado' });
          return;
        }

        const quarentenaItem = rows[0];

        const insertHistoricoQuery = `INSERT INTO historico_aquisicoes 
          (nome, produto_id, data_aquisicao, data_fabricacao, data_validade, data_chegada, quantidade, valor_total, data_entrada, data_saida, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const { nome, produto_id, data_aquisicao, data_fabricacao, data_validade, data_chegada, quantidade, valor_total } = quarentenaItem;
        db.query(insertHistoricoQuery, [nome, produto_id, data_aquisicao, data_fabricacao, data_validade, data_chegada, quantidade, valor_total, data_entrada, data_saida, status], (err, result) => {
          if (err) {
            console.error('Erro ao inserir dados no histórico:', err);
            res.status(500).json({ success: false, message: 'Erro ao inserir dados no histórico' });
            return;
          }

          if (status === 'Aprovado') {
            if (nomesPrimaria.includes(nome)) {
              const insertPrimariaQuery = `INSERT INTO material_embalagem_primaria 
                (nome, produto_id, aquisicao, fabricacao, validade, quantidade, valor) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
              db.query(insertPrimariaQuery, [nome, produto_id, data_aquisicao, data_fabricacao, data_validade, quantidade, valor_total], (err, result) => {
                if (err) {
                  console.error('Erro ao inserir dados na embalagem primária:', err);
                  res.status(500).json({ success: false, message: 'Erro ao inserir dados na embalagem primária' });
                  return;
                }

                console.log('Dados inseridos na embalagem primária com sucesso');
                res.json({ success: true, message: 'Dados da quarentena atualizados com sucesso, inseridos no histórico e na embalagem primária' });
              });
            } else if (nomesSecundaria.includes(nome)) {
              const insertSecundariaQuery = `INSERT INTO material_embalagem_secundaria 
                (nome, produto_id, aquisicao, fabricacao, validade, quantidade, valor) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
              db.query(insertSecundariaQuery, [nome, produto_id, data_aquisicao, data_fabricacao, data_validade, quantidade, valor_total], (err, result) => {
                if (err) {
                  console.error('Erro ao inserir dados na embalagem secundária:', err);
                  res.status(500).json({ success: false, message: 'Erro ao inserir dados na embalagem secundária' });
                  return;
                }

                console.log('Dados inseridos na embalagem secundária com sucesso');
                res.json({ success: true, message: 'Dados da quarentena atualizados com sucesso, inseridos no histórico e na embalagem secundária' });
              });
            } else {
              console.log('Dados inseridos no histórico com sucesso');
              res.json({ success: true, message: 'Dados da quarentena atualizados com sucesso e inseridos no histórico' });
            }
          } else {
            console.log('Dados inseridos no histórico com sucesso');
            res.json({ success: true, message: 'Dados da quarentena atualizados com sucesso e inseridos no histórico' });
          }
        });
      });
    } else {
      res.json({ success: true, message: 'Dados da quarentena atualizados com sucesso' });
    }
  });
});

app.get('/quarentena_mp', (req, res) => {
  const query = 'SELECT * FROM quarentena_mp WHERE status = "Pendente"';

  db.query(query, (err, result) => {
    if (err) {
      console.error('Erro ao obter dados da quarentena:', err);
      res.status(500).json({ success: false, message: 'Erro ao obter dados da quarentena' });
      return;
    }

    res.json(result); 
  });
});


app.get('/quarentena_mp/:produtoId', (req, res) => {
  const produtoId = req.params.produtoId;

  const selectQuery = 'SELECT * FROM quarentena_mp WHERE produto_id = ?';
  db.query(selectQuery, produtoId, (err, result) => {
    if (err) {
      console.error('Erro ao buscar dados da quarentena:', err);
      res.status(500).json({ success: false, message: 'Erro ao buscar dados da quarentena' });
      return;
    }

    if (result.length === 0) {
      res.status(404).json({ success: false, message: 'Item da quarentena não encontrado' });
      return;
    }

    res.json(result[0]); 
  });
});

app.post('/quarentena_mp/:produtoId', (req, res) => {
  const produtoId = req.params.produtoId;
  const { data_entrada, data_saida, status } = req.body;

  const updateQuery = 'UPDATE quarentena_mp SET data_entrada = ?, data_saida = ?, status = ? WHERE produto_id = ?';
  db.query(updateQuery, [data_entrada, data_saida, status, produtoId], (err, result) => {
    if (err) {
      console.error('Erro ao atualizar os dados da quarentena:', err);
      res.status(500).json({ success: false, message: 'Erro ao atualizar os dados da quarentena' });
      return;
    }

    if (status !== 'Pendente') {
      const selectQuery = 'SELECT * FROM quarentena_mp WHERE produto_id = ?';
      db.query(selectQuery, [produtoId], (err, rows) => {
        if (err) {
          console.error('Erro ao selecionar dados da quarentena:', err);
          res.status(500).json({ success: false, message: 'Erro ao selecionar dados da quarentena' });
          return;
        }

        if (rows.length === 0) {
          res.status(404).json({ success: false, message: 'Item da quarentena não encontrado' });
          return;
        }

        const quarentenaItem = rows[0];

        const insertHistoricoQuery = `INSERT INTO historico_aquisicoes 
          (nome, produto_id, data_aquisicao, data_fabricacao, data_validade, data_chegada, quantidade, valor_total, data_entrada, data_saida, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const { nome, produto_id, data_aquisicao, data_fabricacao, data_validade, data_chegada, quantidade, valor_total } = quarentenaItem;
        db.query(insertHistoricoQuery, [nome, produto_id, data_aquisicao, data_fabricacao, data_validade, data_chegada, quantidade, valor_total, data_entrada, data_saida, status], (err, result) => {
          if (err) {
            console.error('Erro ao inserir dados no histórico:', err);
            res.status(500).json({ success: false, message: 'Erro ao inserir dados no histórico' });
            return;
          }

          if (status === 'Aprovado') {
            const insertMateriaPrimaQuery = `INSERT INTO materia_prima 
              (nome, produto_id, aquisicao, fabricacao, validade, quantidade, valor) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`;
            db.query(insertMateriaPrimaQuery, [nome, produto_id, data_aquisicao, data_fabricacao, data_validade, quantidade, valor_total], (err, result) => {
              if (err) {
                console.error('Erro ao inserir dados na matéria-prima:', err);
                res.status(500).json({ success: false, message: 'Erro ao inserir dados na matéria-prima' });
                return;
              }

              console.log('Dados inseridos na matéria-prima com sucesso');
              res.json({ success: true, message: 'Dados da quarentena atualizados com sucesso, inseridos no histórico e na matéria-prima' });
            });
          } else {
            console.log('Dados inseridos no histórico com sucesso');
            res.json({ success: true, message: 'Dados da quarentena atualizados com sucesso e inseridos no histórico' });
          }
        });
      });
    } else {
      res.json({ success: true, message: 'Dados da quarentena atualizados com sucesso' });
    }
  });
});

app.get('/historico_aquisicoes', (req, res) => {
  const query = 'SELECT * FROM historico_aquisicoes';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao obter dados do histórico de aquisições:', err);
      res.status(500).json({ success: false, message: 'Erro ao obter dados do histórico de aquisições' });
      return;
    }
    res.json(results);
  });
});

app.get('/materia_prima_vencida', (req, res) => {
  const currentDate = new Date().toISOString().slice(0, 10); 
  const query = 'SELECT nome, produto_id, fabricacao, validade, quantidade, valor AS valorTotal FROM materia_prima WHERE validade < ?';

  db.query(query, [currentDate], (err, results) => {
    if (err) {
      console.error('Erro ao obter dados de matéria-prima vencida:', err);
      res.status(500).json({ success: false, message: 'Erro ao obter dados de matéria-prima vencida' });
      return;
    }
    res.json(results);
  });
});

app.get('/material_embalagem_vencida', (req, res) => {
  const currentDate = new Date().toISOString().slice(0, 10); 
  
  const queryPrimaria = 'SELECT nome, produto_id, quantidade, valor FROM material_embalagem_primaria WHERE validade < ?';
  const querySecundaria = 'SELECT nome, produto_id, quantidade, valor FROM material_embalagem_secundaria WHERE validade < ?';

  db.query(queryPrimaria, [currentDate], (errPrimaria, resultsPrimaria) => {
    if (errPrimaria) {
      console.error('Erro ao obter dados de material de embalagem primária vencida:', errPrimaria);
      res.status(500).json({ success: false, message: 'Erro ao obter dados de material de embalagem primária vencida' });
      return;
    }

    console.log('Dados de material de embalagem primária vencida:', resultsPrimaria); 

    db.query(querySecundaria, [currentDate], (errSecundaria, resultsSecundaria) => {
      if (errSecundaria) {
        console.error('Erro ao obter dados de material de embalagem secundária vencida:', errSecundaria);
        res.status(500).json({ success: false, message: 'Erro ao obter dados de material de embalagem secundária vencida' });
        return;
      }

      console.log('Dados de material de embalagem secundária vencida:', resultsSecundaria); 

      const results = [...resultsPrimaria, ...resultsSecundaria];
      res.json(results);
    });
  });
});

app.get('/ultimos_dados', async (req, res) => {
  try {
    const queryProdutos = 'SELECT nome, produto_id, quantidade FROM produtos ORDER BY id DESC LIMIT 1';
    const queryQuarentenaMP = 'SELECT nome, produto_id, quantidade, data_entrada FROM quarentena_mp ORDER BY id DESC LIMIT 1';
    const queryQuarentenaME = 'SELECT nome, produto_id, quantidade, data_entrada FROM quarentena_me ORDER BY id DESC LIMIT 1';
    const queryHistorico = 'SELECT nome, produto_id, quantidade, data_entrada, data_saida, status FROM historico_aquisicoes ORDER BY id DESC LIMIT 1';

    const [
      produtosResult,
      quarentenaMPResult,
      quarentenaMEResult,
      historicoResult
    ] = await Promise.all([
      executeQuery(queryProdutos),
      executeQuery(queryQuarentenaMP),
      executeQuery(queryQuarentenaME),
      executeQuery(queryHistorico)
    ]);

    const data = {
      produtos: produtosResult[0],
      quarentenaMP: quarentenaMPResult[0],
      quarentenaME: quarentenaMEResult[0],
      historico: historicoResult[0]
    };

    res.json(data);
  } catch (error) {
    console.error('Erro ao obter últimos dados:', error);
    res.status(500).json({ error: 'Erro ao obter últimos dados' });
  }
});

function executeQuery(query) {
  return new Promise((resolve, reject) => {
    db.query(query, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

app.get('/dashboards_data', async (req, res) => {
  try {
    const queryAvgAnalysisTimeMP = `
      SELECT AVG(DATEDIFF(data_saida, data_entrada)) AS avgAnalysisTimeMP
      FROM historico_aquisicoes
      WHERE nome IN ('02254', '02261', '02298', '02301', '02307', '02314', '02325', '02391', '02392', '02013', '02016', '02020', '02022', '02058', '02068', '02074', '02108', '02119', '02188', '02232', '02242', '02266', '02297', '02302', '02303', '02304', '02305', '02306', '02309', '02311', '02315', '02326', '02330', '02332', '02333', '02377', '02378', '02399', '02400')
      AND status = 'Aprovado'
    `;
    const queryAvgAnalysisTimeME = `
      SELECT AVG(DATEDIFF(data_saida, data_entrada)) AS avgAnalysisTimeME
      FROM historico_aquisicoes
      WHERE nome IN ('11816', '11818', '11842', '11813', '11843', '11876', '11877', '11888', '11886', '11887', '11885', '11875', '11819', '11906', '11904', '11909', '11958', '11959', '11396', '11795', '11796', '11797', '11808', '11922', '11580', '11845', '11856', '11921', '11854', '11844', '11853', '11869', '11872', '11895', '11870', '11894', '11867', '11873', '11897', '11868', '11893', '11871', '11892', '11744', '11747', '11940', '11951', '11908', '11937', '11938', '11939', '11687', '11911', '11912', '11913', '11910')
      AND status = 'Aprovado'
    `;
    const queryAvgOrderTime = `
      SELECT AVG(DATEDIFF(data_chegada, data_aquisicao)) AS avgOrderTime
      FROM historico_aquisicoes
      WHERE status = 'Aprovado'
    `;

    const [resultAvgAnalysisTimeMP, resultAvgAnalysisTimeME, resultAvgOrderTime] = await Promise.all([
      executeQuery(queryAvgAnalysisTimeMP),
      executeQuery(queryAvgAnalysisTimeME),
      executeQuery(queryAvgOrderTime)
    ]);

    const data = {
      avgAnalysisTimeMP: resultAvgAnalysisTimeMP[0].avgAnalysisTimeMP || 0,
      avgAnalysisTimeME: resultAvgAnalysisTimeME[0].avgAnalysisTimeME || 0,
      avgOrderTime: resultAvgOrderTime[0].avgOrderTime || 0
    };

    res.json(data);
  } catch (error) {
    console.error('Erro ao obter dados dos dashboards:', error);
    res.status(500).json({ error: 'Erro ao obter dados dos dashboards' });
  }
});

function executeQuery(query) {
  return new Promise((resolve, reject) => {
    db.query(query, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
