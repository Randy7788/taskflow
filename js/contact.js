export function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
 
const nombre = document.getElementById("nombre");
const email = document.getElementById("email");
const mensaje = document.getElementById("mensaje");

const nombreError = document.getElementById("nombre-error");
const emailError = document.getElementById("email-error");
const mensajeError = document.getElementById("mensaje-error");
const status = document.getElementById("form-status");

function limpiarErrores() {
     nombreError.textContent = "";
    emailError.textContent = "";
    mensajeError.textContent = "";
    status.textContent = ""; 
}

 function validarCampo(input, errorEl, mensaje) {
    if (!input.checkValidity()) {
      errorEl.textContent = mensaje;
      return false;
    }
    return true;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault(); // evita recargar la página
    limpiarErrores();

    const okNombre = validarCampo(
      nombre,
      nombreError,
      "Nombre inválido: usa entre 2 y 40 caracteres."
    );

    const okEmail = validarCampo(
      email,
      emailError,
      "Email inválido: revisa el formato (ej: nombre@dominio.com)."
    );

    const okMensaje = validarCampo(
      mensaje,
      mensajeError,
      "Mensaje inválido: mínimo 10 y máximo 300 caracteres."
    );

    if (!(okNombre && okEmail && okMensaje)) {
      status.textContent = "Corrige los errores y vuelve a intentar.";
      return;
    }

    // Simulación de “enviar al backend”
    const data = {
      nombre: nombre.value.trim(),
      email: email.value.trim(),
      mensaje: mensaje.value.trim(),
    };

    console.log("Enviando al backend:", data);

    status.textContent = "✅ Formulario válido. (Simulado) Datos listos para enviar.";
    form.reset();
  });
}