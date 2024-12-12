'use strict';

// Open and close modals dynamically
document.addEventListener('DOMContentLoaded', () => {
    const btnsOpenModal = document.querySelectorAll('.show-modal');
    const modals = document.querySelectorAll('.modal');
    const overlays = document.querySelectorAll('.overlay');

    const openModal = function (modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById(`overlay-${modalId.split('-')[1]}`);
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');

        // Close modal when overlay is clicked
        overlay.addEventListener('click', () => closeModal(modalId));
    };

    const closeModal = function (modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById(`overlay-${modalId.split('-')[1]}`);
        modal.classList.add('hidden');
        overlay.classList.add('hidden');
    };

    btnsOpenModal.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-modal-id');
            openModal(modalId);
        });
    });

    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            const modalId = modal.getAttribute('id');
            closeModal(modalId);
        });
    });

    // Close modal on "Escape" key press
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            modals.forEach(modal => {
                if (!modal.classList.contains('hidden')) {
                    const modalId = modal.getAttribute('id');
                    closeModal(modalId);
                }
            });
        }
    });
});
