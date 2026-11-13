const passwordOutput = document.getElementById('passwordOutput');
const copyButton = document.getElementById('copyButton');
const generateButton = document.getElementById('generateButton');

const lengthSlider = document.getElementById('lengthSlider');
const lengthValue = document.getElementById('lengthValue');

const uppercaseCheckbox = document.getElementById('uppercase');
const lowercaseCheckbox = document.getElementById('lowercase');
const numbersCheckbox = document.getElementById('numbers');
const symbolsCheckbox = document.getElementById('symbols');

const strengthText = document.getElementById('strengthText');
const strengthBar = document.getElementById('strengthBar');

const errorMessage = document.getElementById('errorMessage');
const copyMessage = document.getElementById('copyMessage');
const toast = document.getElementById('toast');

const characterSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

function getSelectedCharacterSets() {
    const selectedSets = [];

    if (uppercaseCheckbox.checked) {
        selectedSets.push(characterSets.uppercase);
    }

    if (lowercaseCheckbox.checked) {
        selectedSets.push(characterSets.lowercase);
    }

    if (numbersCheckbox.checked) {
        selectedSets.push(characterSets.numbers);
    }

    if (symbolsCheckbox.checked) {
        selectedSets.push(characterSets.symbols);
    }

    return selectedSets;
}

function getSecureRandomIndex(maximum) {
    if (!Number.isSafeInteger(maximum) || maximum <= 0) {
        throw new Error('Invalid random selection range.');
    }

    const randomValues = new Uint32Array(1);
    const range = 0x100000000;
    const limit = range - (range % maximum);

    let randomNumber;

    do {
        crypto.getRandomValues(randomValues);
        randomNumber = randomValues[0];
    } while (randomNumber >= limit);

    return randomNumber % maximum;
}

function getRandomCharacter(characters) {
    const randomIndex = getSecureRandomIndex(characters.length);

    return characters[randomIndex];
}

function shufflePassword(characters) {
    for (let index = characters.length - 1; index > 0; index--) {
        const randomIndex = getSecureRandomIndex(index + 1);

        [characters[index], characters[randomIndex]] =
            [characters[randomIndex], characters[index]];
    }

    return characters.join('');
}

function generatePassword() {
    errorMessage.textContent = '';
    copyMessage.textContent = '';

    if (!window.crypto || !window.crypto.getRandomValues) {
        errorMessage.textContent =
            'Secure password generation is not supported in this browser.';
        return;
    }

    const selectedSets = getSelectedCharacterSets();
    const passwordLength = Number(lengthSlider.value);

    if (selectedSets.length === 0) {
        passwordOutput.value = '';
        updateStrength('');
        errorMessage.textContent =
            'Please select at least one character type.';
        return;
    }

    if (!Number.isInteger(passwordLength) ||
        passwordLength < 8 ||
        passwordLength > 64) {
        errorMessage.textContent =
            'Please select a password length between 8 and 64.';
        return;
    }

    const allCharacters = selectedSets.join('');
    const passwordCharacters = [];

    // Add at least one character from every selected category.
    selectedSets.forEach((characterSet) => {
        passwordCharacters.push(getRandomCharacter(characterSet));
    });

    // Fill the remaining password length using all selected categories.
    while (passwordCharacters.length < passwordLength) {
        passwordCharacters.push(getRandomCharacter(allCharacters));
    }

    // Randomize the final character positions.
    const finalPassword = shufflePassword(passwordCharacters);

    passwordOutput.value = finalPassword;

    updateStrength(finalPassword);
}

function updateStrength(password) {
    if (!password) {
        strengthText.textContent = 'Not generated';
        strengthBar.style.width = '0%';
        strengthBar.style.backgroundColor = '';
        return;
    }

    let score = 0;

    if (password.length >= 12) {
        score++;
    }

    if (password.length >= 16) {
        score++;
    }

    if (/[A-Z]/.test(password)) {
        score++;
    }

    if (/[a-z]/.test(password)) {
        score++;
    }

    if (/[0-9]/.test(password)) {
        score++;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
        score++;
    }

    if (score <= 2) {
        strengthText.textContent = 'Weak';
        strengthBar.style.width = '30%';
        strengthBar.style.backgroundColor = '#d94b5c';
    } else if (score <= 4) {
        strengthText.textContent = 'Medium';
        strengthBar.style.width = '65%';
        strengthBar.style.backgroundColor = '#e5a12c';
    } else {
        strengthText.textContent = 'Strong';
        strengthBar.style.width = '100%';
        strengthBar.style.backgroundColor = '#169b70';
    }
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');

    window.setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

async function copyPassword() {
    const password = passwordOutput.value;

    if (!password) {
        copyMessage.textContent = 'Generate a password first.';
        return;
    }

    try {
        await navigator.clipboard.writeText(password);

        copyMessage.textContent = 'Password copied to clipboard.';
        showToast('Password copied successfully!');
    } catch (error) {
        // Fallback for browsers without Clipboard API access.
        passwordOutput.focus();
        passwordOutput.select();

        const copied = document.execCommand('copy');

        if (copied) {
            copyMessage.textContent = 'Password copied to clipboard.';
            showToast('Password copied successfully!');
        } else {
            copyMessage.textContent =
                'Copy unavailable. Please select and copy manually.';
        }
    }
}

// Update the displayed password length.
lengthSlider.addEventListener('input', () => {
    lengthValue.textContent = lengthSlider.value;
});

// Generate a new password.
generateButton.addEventListener('click', generatePassword);

// Copy the generated password.
copyButton.addEventListener('click', copyPassword);

// Clear old errors when character settings change.
const optionCheckboxes = [
    uppercaseCheckbox,
    lowercaseCheckbox,
    numbersCheckbox,
    symbolsCheckbox
];

optionCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
        errorMessage.textContent = '';
        copyMessage.textContent = '';
    });
});

// Generate the first password when the page loads.
generatePassword();