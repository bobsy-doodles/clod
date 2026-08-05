// Warehouse Wallet — app logic
// Requires config.js to define SUPABASE_URL and SUPABASE_ANON_KEY before this file loads.

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let isSignUpMode = false;
let currentCard = null; // the row from membership_cards, or null

// ---------- element refs ----------
const authView = document.getElementById('authView');
const dashView = document.getElementById('dashView');
const signOutBtn = document.getElementById('signOutBtn');

const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubmit = document.getElementById('authSubmit');
const authError = document.getElementById('authError');
const switchPrompt = document.getElementById('switchPrompt');
const switchModeBtn = document.getElementById('switchModeBtn');

const emptyState = document.getElementById('emptyState');
const cardDisplay = document.getElementById('cardDisplay');
const addCardBtnEmpty = document.getElementById('addCardBtnEmpty');
const editCardBtn = document.getElementById('editCardBtn');
const deleteCardBtn = document.getElementById('deleteCardBtn');

const cardModal = document.getElementById('cardModal');
const cardForm = document.getElementById('cardForm');
const modalTitle = document.getElementById('modalTitle');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const formError = document.getElementById('formError');

const memberNameInput = document.getElementById('memberName');
const membershipNumberInput = document.getElementById('membershipNumber');
const membershipTypeInput = document.getElementById('membershipType');
const expirationDateInput = document.getElementById('expirationDate');

// ---------- auth mode switching ----------
switchModeBtn.addEventListener('click', () => {
  isSignUpMode = !isSignUpMode;
  authTitle.textContent = isSignUpMode ? 'Create your wallet' : 'Sign in to your wallet';
  authSubmit.textContent = isSignUpMode ? 'Create account' : 'Sign in';
  switchPrompt.textContent = isSignUpMode ? 'Already have an account?' : 'New here?';
  switchModeBtn.textContent = isSignUpMode ? 'Sign in' : 'Create an account';
  authError.classList.add('hidden');
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.classList.add('hidden');
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;

  authSubmit.disabled = true;
  try {
    if (isSignUpMode) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      authError.textContent = 'Account created. Check your email to confirm, then sign in.';
      authError.classList.remove('hidden');
      authError.style.color = 'var(--leaf-green)';
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // onAuthStateChange will handle the view switch
    }
  } catch (err) {
    authError.style.color = 'var(--rust-red)';
    authError.textContent = err.message || 'Something went wrong.';
    authError.classList.remove('hidden');
  } finally {
    authSubmit.disabled = false;
  }
});

signOutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// ---------- auth state ----------
supabase.auth.onAuthStateChange((_event, session) => {
  if (session) {
    showDashboard();
    loadCard();
  } else {
    showAuth();
  }
});

async function checkInitialSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    showDashboard();
    loadCard();
  } else {
    showAuth();
  }
}
checkInitialSession();

function showAuth() {
  authView.classList.remove('hidden');
  dashView.classList.add('hidden');
  signOutBtn.classList.add('hidden');
}
function showDashboard() {
  authView.classList.add('hidden');
  dashView.classList.remove('hidden');
  signOutBtn.classList.remove('hidden');
}

// ---------- card CRUD ----------
async function loadCard() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('membership_cards')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Failed to load card:', error.message);
    return;
  }

  currentCard = data;
  renderCard();
}

function renderCard() {
  if (!currentCard) {
    emptyState.classList.remove('hidden');
    cardDisplay.classList.add('hidden');
    return;
  }
  emptyState.classList.add('hidden');
  cardDisplay.classList.remove('hidden');

  document.getElementById('cardName').textContent = currentCard.member_name.toUpperCase();
  document.getElementById('cardNumber').textContent = formatNumber(currentCard.membership_number);
  document.getElementById('cardTier').textContent = currentCard.membership_type.toUpperCase();
  document.getElementById('cardExpiry').textContent = formatDate(currentCard.expiration_date);

  updateStatusFlag(currentCard.expiration_date);

  try {
    JsBarcode('#barcodeSvg', currentCard.membership_number, {
      format: 'CODE39',
      lineColor: '#24262b',
      width: 1.6,
      height: 38,
      displayValue: false,
      margin: 0
    });
  } catch (e) {
    console.error('Barcode render failed:', e.message);
  }
}

function formatNumber(num) {
  return String(num).replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' });
}

function updateStatusFlag(dateStr) {
  const flag = document.getElementById('statusFlag');
  const today = new Date();
  const exp = new Date(dateStr + 'T00:00:00');
  const daysLeft = Math.floor((exp - today) / (1000 * 60 * 60 * 24));

  flag.classList.remove('warn', 'expired');
  if (daysLeft < 0) {
    flag.textContent = 'EXPIRED';
    flag.classList.add('expired');
  } else if (daysLeft <= 30) {
    flag.textContent = 'EXPIRES SOON';
    flag.classList.add('warn');
  } else {
    flag.textContent = 'ACTIVE';
  }
}

// ---------- modal ----------
function openModal(editing) {
  formError.classList.add('hidden');
  cardForm.reset();
  if (editing && currentCard) {
    modalTitle.textContent = 'Edit your card';
    memberNameInput.value = currentCard.member_name;
    membershipNumberInput.value = currentCard.membership_number;
    membershipTypeInput.value = currentCard.membership_type;
    expirationDateInput.value = currentCard.expiration_date;
  } else {
    modalTitle.textContent = 'Add your card';
  }
  cardModal.classList.remove('hidden');
}
function closeModal() {
  cardModal.classList.add('hidden');
}

addCardBtnEmpty.addEventListener('click', () => openModal(false));
editCardBtn.addEventListener('click', () => openModal(true));
cancelModalBtn.addEventListener('click', closeModal);
cardModal.addEventListener('click', (e) => {
  if (e.target === cardModal) closeModal();
});

cardForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.classList.add('hidden');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const payload = {
    user_id: user.id,
    member_name: memberNameInput.value.trim(),
    membership_number: membershipNumberInput.value.trim(),
    membership_type: membershipTypeInput.value,
    expiration_date: expirationDateInput.value
  };

  const saveBtn = document.getElementById('saveCardBtn');
  saveBtn.disabled = true;
  try {
    let error;
    if (currentCard) {
      ({ error } = await supabase
        .from('membership_cards')
        .update(payload)
        .eq('id', currentCard.id));
    } else {
      ({ error } = await supabase
        .from('membership_cards')
        .insert(payload));
    }
    if (error) throw error;

    await loadCard();
    closeModal();
  } catch (err) {
    formError.textContent = err.message || 'Could not save card.';
    formError.classList.remove('hidden');
  } finally {
    saveBtn.disabled = false;
  }
});

deleteCardBtn.addEventListener('click', async () => {
  if (!currentCard) return;
  if (!confirm('Remove this card from your wallet?')) return;

  const { error } = await supabase
    .from('membership_cards')
    .delete()
    .eq('id', currentCard.id);

  if (error) {
    alert('Could not remove card: ' + error.message);
    return;
  }
  currentCard = null;
  renderCard();
});
