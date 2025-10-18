function setStatus(el, tipo, msg){
  el.classList.remove('info','success','error');
  if (tipo) el.classList.add(tipo);
  el.textContent = msg;
}

/**
 * Cria uma Promise que rejeita se estourar o tempo (ms).
 * Para usar com Promise.race.
 */
function timeout(ms){
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Tempo limite excedido.')), ms);
  });
}

// --------- 1) BUSCAR CEP (ViaCEP) ---------
const formCep = document.getElementById('form-cep');
const cepInput = document.getElementById('cep');
const btnBuscar = document.getElementById('btnBuscar');
const statusEl = document.getElementById('status');

const logradouro = document.getElementById('logradouro');
const bairro = document.getElementById('bairro');
const localidade = document.getElementById('localidade');
const uf = document.getElementById('uf');

formCep.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cep = cepInput.value.replace(/\D/g,'');

  if (cep.length !== 8){
    setStatus(statusEl, 'error', 'CEP inválido. Use 8 dígitos.');
    return;
  }

  // estado de loading
  btnBuscar.disabled = true;
  setStatus(statusEl, 'info', 'Buscando CEP...');

  try {
    const data = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then(r => {
        if(!r.ok) throw new Error('Falha na requisição.');
        return r.json();
      });

    if (data.erro){
      throw new Error('CEP não encontrado.');
    }

    logradouro.value = data.logradouro || '';
    bairro.value     = data.bairro || '';
    localidade.value = data.localidade || '';
    uf.value         = data.uf || '';

    setStatus(statusEl, 'success', 'Endereço preenchido com sucesso!');
  } catch (err) {
    setStatus(statusEl, 'error', err.message || 'Erro ao buscar CEP.');
    logradouro.value = '';
    bairro.value     = '';
    localidade.value = '';
    uf.value         = '';
  } finally {
    btnBuscar.disabled = false;
  }
});

// --------- 2) SALVAR CADASTRO (simulado) ---------
const btnSalvar = document.getElementById('btnSalvar');
const statusSalvar = document.getElementById('statusSalvar');

/**
 * Simula salvamento com latência e chance de falha.
 * Retorna Promise que resolve com mensagem de sucesso ou rejeita com erro.
 */
function salvarCadastroSimulado(dados){
  return new Promise((resolve, reject) => {
    const atraso = Math.floor(Math.random()*2000) + 800; // 0.8s a 2.8s
    const falha = Math.random() < 0.25; // 25% de chance de falhar
    setTimeout(() => {
      if (falha) reject(new Error('Falha ao salvar no servidor.'));
      else resolve({ ok: true, id: Math.floor(Math.random()*10000), dados });
    }, atraso);
  });
}

btnSalvar.addEventListener('click', async () => {
  const dados = {
    cep: cepInput.value.replace(/\D/g,''),
    logradouro: logradouro.value.trim(),
    bairro: bairro.value.trim(),
    localidade: localidade.value.trim(),
    uf: uf.value.trim()
  };

  if (!dados.cep || dados.cep.length !== 8){
    setStatus(statusSalvar, 'error', 'Informe um CEP válido antes de salvar.');
    return;
  }

  btnSalvar.disabled = true;
  setStatus(statusSalvar, 'info', 'Salvando cadastro...');

  try {
    const resp = await salvarCadastroSimulado(dados);
    setStatus(statusSalvar, 'success', `Cadastro salvo! ID: ${resp.id}.`);
  } catch (err) {
    setStatus(statusSalvar, 'error', err.message || 'Erro ao salvar cadastro.');
  } finally {
    btnSalvar.disabled = false; 
  }
});

// --------- 3) PROMISE.ALL — Buscar múltiplos CEPs ---------
const cepsLista = document.getElementById('cepsLista');
const btnBuscarMultiplos = document.getElementById('btnBuscarMultiplos');
const tbodyResultados = document.getElementById('tbodyResultados');
const statusMultiplos = document.getElementById('statusMultiplos');

btnBuscarMultiplos.addEventListener('click', async () => {
  const entrada = (cepsLista.value || '').trim();

  if (!entrada){
    setStatus(statusMultiplos, 'error', 'Digite ao menos um CEP.');
    return;
  }

  const ceps = entrada
    .split(/[\s,;]+/)
    .map(c => c.replace(/\D/g,''))
    .filter(c => c.length > 0);

  if (ceps.length === 0){
    setStatus(statusMultiplos, 'error', 'Nenhum CEP válido informado.');
    return;
  }

  setStatus(statusMultiplos, 'info', 'Buscando CEPs...');
  btnBuscarMultiplos.disabled = true;
  tbodyResultados.innerHTML = '';

  try {
    // mapear para array de Promises de fetch/json
    // OBS: usamos Promise.all, mas cada promessa captura seu próprio erro
    // para que a lista continue (em vez de rejeitar tudo).
    const promessas = ceps.map(cep => {
      const url = `https://viacep.com.br/ws/${cep}/json/`;
      return fetch(url)
        .then(r => {
          if(!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(data => {
          if (data.erro) {
            return { cep, erro: true, motivo: 'CEP não encontrado.' };
          }
          return {
            cep,
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            localidade: data.localidade || '',
            uf: data.uf || ''
          };
        })
        .catch(() => ({ cep, erro: true, motivo: 'Falha na busca.' }));
    });

    // usar Promise.all e preencher a tabela
    const resultados = await Promise.all(promessas);

    resultados.forEach(item => {
      const tr = document.createElement('tr');
      if (item.erro){
        tr.innerHTML = `
          <td>${item.cep}</td>
          <td colspan="4" style="color:#b00020;font-weight:600;">${item.motivo}</td>
        `;
      } else {
        tr.innerHTML = `
          <td>${item.cep}</td>
          <td>${item.logradouro}</td>
          <td>${item.bairro}</td>
          <td>${item.localidade}</td>
          <td>${item.uf}</td>
        `;
      }
      tbodyResultados.appendChild(tr);
    });

    setStatus(statusMultiplos, 'success', 'Busca concluída!');
  } catch (err) {
    setStatus(statusMultiplos, 'error', err.message || 'Erro ao buscar múltiplos CEPs.');
  } finally {
    btnBuscarMultiplos.disabled = false;
  }
});

// --------- 4) PROMISE.RACE — Timeout de busca ---------
const cepTimeout = document.getElementById('cepTimeout');
const btnBuscarTimeout = document.getElementById('btnBuscarTimeout');
const statusTimeout = document.getElementById('statusTimeout');

btnBuscarTimeout.addEventListener('click', async () => {
  const cep = (cepTimeout.value || '').replace(/\D/g,'');

  if (cep.length !== 8){
    setStatus(statusTimeout, 'error', 'CEP inválido. Use 8 dígitos.');
    return;
  }

  setStatus(statusTimeout, 'info', 'Buscando com timeout (2s)...');
  btnBuscarTimeout.disabled = true;

  try {
    // Promise.race entre a requisição e o timeout
    const resposta = await Promise.race([
      fetch(`https://viacep.com.br/ws/${cep}/json/`).then(r => {
        if (!r.ok) throw new Error('Falha na requisição.');
        return r.json();
      }),
      timeout(2000)
    ]);

    if (resposta.erro){
      throw new Error('CEP não encontrado.');
    }

    setStatus(statusTimeout, 'success', `OK: ${resposta.logradouro || '(sem logradouro)'} - ${resposta.localidade}/${resposta.uf}`);
  } catch (err) {
    // tratar erro de timeout (e outros)
    setStatus(statusTimeout, 'error', err.message === 'Tempo limite excedido.' ? 'Timeout: servidor demorou a responder.' : err.message);
  } finally {
    btnBuscarTimeout.disabled = false;
  }
});