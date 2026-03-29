import {lumina} from '../dist/index.js';

// Básico
lumina.loading({
    title: 'Listo.',
    description: 'Archivo guardado.', 
    position: 'top-center', 
    duration: -1 
})
lumina.error({
    title: 'Error',
    description: 'No se pudo conectar.',
    position: 'bottom-center', 
    duration: -1 
})
lumina.warning({
    title: 'Warining',
    description: 'No se pudo conectar.',
    position: 'bottom-right', 
    duration: 3500 
});

lumina.action({
    title: 'Archivo eliminado',
    description: 'El elemento se movió a la papelera.',
    position: 'bottom-left',
    button: {
        label: 'Deshacer',
        onClick: () => {
            console.log('Acción deshecha');
        }
    }
});

lumina.success({
    title: 'Subiendo...',
    description: 'Archivo Guardado!',
    position: 'top-left',
    duration: -1
})
lumina.info({
    title: 'Info',
    description: 'Texto largo...', autopilot: true, 
    duration: 3500
})
