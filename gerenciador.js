// ===== Estado & helpers =====
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

const form = $('#formTask');
const input = $('#taskInput');
const list = $('#taskList');
const clearDoneBtn = $('#clearDoneBtn');

let tasks = load();

// ===== Persistência local =====
function load(){
  try{
    const raw = localStorage.getItem('tasks_v1');
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.warn('localStorage inválido, iniciando vazio');
    return [];
  }
}
function save(){
  localStorage.setItem('tasks_v1', JSON.stringify(tasks));
}

// ===== Render =====
function render(){
  list.innerHTML = '';
  if (tasks.length === 0){
    const li = document.createElement('li');
    li.style.color = '#666';
    li.style.padding = '10px 6px';
    li.textContent = 'Nenhuma tarefa ainda.';
    list.appendChild(li);
    return;
  }

  tasks.forEach(task => list.appendChild(renderItem(task)));
}

function renderItem(task){
  const li = document.createElement('li');
  li.className = 'task' + (task.done ? ' done' : '');
  li.dataset.id = task.id;

  // checkbox
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = task.done;
  cb.addEventListener('change', () => toggleDone(task.id, cb.checked));

  // título (ou campo de edição)
  const title = document.createElement('div');
  title.className = 'task-title';
  title.textContent = task.title;

  // ações
  const actions = document.createElement('div');
  actions.className = 'actions';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.textContent = 'Editar';
  editBtn.addEventListener('click', () => startEdit(task.id, li));

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.textContent = 'Excluir';
  delBtn.addEventListener('click', () => removeTask(task.id));

  actions.append(editBtn, delBtn);

  li.append(cb, title, actions);
  return li;
}

// ===== Ações =====
function addTask(title){
  const t = title.trim();
  if (!t) return;

  tasks.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()),
    title: t,
    done: false,
    createdAt: Date.now()
  });
  save();
  render();
}

function toggleDone(id, value){
  const i = tasks.findIndex(t => t.id === id);
  if (i >= 0){
    tasks[i].done = !!value;
    save();
    render();
  }
}

function removeTask(id){
  tasks = tasks.filter(t => t.id !== id);
  save();
  render();
}

function clearDone(){
  const hasDone = tasks.some(t => t.done);
  if (!hasDone) return;
  tasks = tasks.filter(t => !t.done);
  save();
  render();
}

// edição inline
function startEdit(id, li){
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  // Substitui o título por um input
  const titleDiv = li.querySelector('.task-title');
  const inputEdit = document.createElement('input');
  inputEdit.type = 'text';
  inputEdit.className = 'edit-input';
  inputEdit.value = task.title;

  // troca de elementos
  titleDiv.replaceWith(inputEdit);
  inputEdit.focus();
  inputEdit.select();

  // confirmar com Enter, cancelar com Esc, blur confirma
  const confirm = () => {
    const newTitle = inputEdit.value.trim();
    if (newTitle){
      task.title = newTitle;
      save();
      render();
    }else{
      // título vazio => remove
      removeTask(id);
    }
  };
  inputEdit.addEventListener('keydown', e => {
    if (e.key === 'Enter') confirm();
    if (e.key === 'Escape') render();
  });
  inputEdit.addEventListener('blur', confirm);
}

// ===== Eventos =====
form.addEventListener('submit', (e) => {
  e.preventDefault();
  addTask(input.value);
  input.value = '';
  input.focus();
});

clearDoneBtn.addEventListener('click', clearDone);

// Enter adiciona, Esc limpa o campo
input.addEventListener('keydown', (e) => {
  if (e.key === 'Escape'){
    input.value = '';
  }
});

// ===== Inicialização =====
render();