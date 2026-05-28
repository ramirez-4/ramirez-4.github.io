/* NODOS DEL DOM */
const input = document.getElementById("integral-input");
const resultBox = document.getElementById("result-box");
const resultCard = document.getElementById("result-card");
const stepsBox = document.getElementById("steps-box");
const explanationBox = document.getElementById("explanation-box");
const methodBox = document.getElementById("method-box");
const historyList = document.getElementById("history-list");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebar-overlay");

/* TEMA CLARO Y OSCURO */
function toggleTheme() {
    document.body.classList.toggle("light");
}

/* CONTROL RESPONSIVO DEL MENÚ LATERAL */
function toggleSidebar() {
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
}

/* DETECTAR CAMBIO DE TEMAS EN EL MENÚ */
function changeModule(name) {
    document.getElementById("module-title").textContent = name;
    // Cerrar automáticamente al seleccionar en dispositivos móviles
    if (window.innerWidth < 900) {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
    }
}

/* INSERTAR SÍMBOLOS DESDE EL TECLADO EN PANTALLA */
function insertMath(value) {
    input.value += value;
    input.focus();
}

/* FILTRO DE ENTRADA INTELIGENTE: YA NO OBLIGA A ESCRIBIR "integrate" */
function prepareExpression(rawInput) {
    let cleaned = rawInput.trim();
    if (cleaned === "") return "";
    
    // Si el usuario ya metió la estructura formal, la dejamos igual
    if (cleaned.startsWith("integrate(")) {
        return cleaned;
    }
    // Si metió solo la función, se la construimos limpiamente con respecto a 'x'
    return `integrate(${cleaned}, x)`;
}

/* RECONOCIMIENTO DE MÉTODOS ANALÍTICOS */
function detectMethod(exp) {
    if (exp.includes("sin")) return "Integral trigonométrica (Seno)";
    if (exp.includes("cos")) return "Integral trigonométrica (Coseno)";
    if (exp.includes("tan")) return "Integral trigonométrica (Tangente)";
    if (exp.includes("log")) return "Integración por Logaritmo Natural";
    if (exp.includes("exp") || exp.includes("e^")) return "Integración Exponencial";
    if (exp.includes("/")) return "Descomposición en Fracciones Parciales";
    return "Integración Algebraica Directa o Polinomial";
}

function generateExplanation(method) {
    return `El motor analítico ha clasificado la estructura como una <strong>${method}</strong>. Se emplearán los teoremas primitivos del cálculo integral para simplificar el operando fundamental.`;
}

function generateSteps(method) {
    return `
        <strong>Paso 1:</strong> Mapeo de la expresión diferencial y extracción de constantes numéricas.<br>
        <strong>Paso 2:</strong> Categorización del integrando bajo el método de <em>${method}</em>.<br>
        <strong>Paso 3:</strong> Aplicación del algoritmo de cálculo simbólico algebraico.<br>
        <strong>Paso 4:</strong> Adición estándar de la constante fundamental de la familia de curvas matemáticas (+ C).
    `;
}

/* CONTROLADOR LOGICO: RESOLVER INTEGRAL */
function solveIntegral() {
    const rawVal = input.value;
    const formattedExp = prepareExpression(rawVal);

    if (formattedExp === "") {
        alert("Por favor, introduce una expresión o función matemática.");
        return;
    }

    // Efecto de parpadeo inteligente en el recuadro de resultados
    resultCard.classList.remove("pulse-animation");
    void resultCard.offsetWidth; // Disparador forzado de Reflow CSS
    resultCard.classList.add("pulse-animation");

    try {
        const method = detectMethod(formattedExp);
        methodBox.innerHTML = `<strong>${method}</strong>`;
        explanationBox.innerHTML = generateExplanation(method);
        stepsBox.innerHTML = generateSteps(method);

        // Resolución formal vía Nerdamer
        const solutionTeX = nerdamer(formattedExp).toTeX();
        
        // Renderizado matemático de KaTeX estable
        katex.render(solutionTeX + " + C", resultBox, {
            throwOnError: false,
            displayMode: true
        });

        saveHistory(rawVal, solutionTeX);
    } catch (error) {
        resultBox.textContent = "Error de sintaxis matemática. Comprueba los operadores.";
        methodBox.textContent = "Indefinido";
        stepsBox.innerHTML = "No se pudo calcular el desglose.";
        console.error(error);
    }
}

/* LIMPIAR EL CAMPO DE TRABAJO */
function clearAll() {
    input.value = "";
    resultBox.innerHTML = "";
    stepsBox.innerHTML = "Aquí aparecerá el procedimiento matemático desglosado.";
    explanationBox.innerHTML = "Aquí aparecerá la explicación teórica de los conceptos aplicados.";
    methodBox.innerHTML = "Esperando análisis...";
    resultCard.classList.remove("pulse-animation");
}

/* HISTORIAL LOCAL EN LOCALSTORAGE */
function saveHistory(exp, resultTeX) {
    let history = JSON.parse(localStorage.getItem("math_history")) || [];
    history.push({ exp, result: resultTeX });
    if (history.length > 10) history.shift(); // Limitar a las últimas 10 consultas
    localStorage.setItem("math_history", JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    let history = JSON.parse(localStorage.getItem("math_history")) || [];
    historyList.innerHTML = "";

    if (history.length === 0) {
        historyList.innerHTML = `<li style="opacity:0.5; font-size:14px;">No hay búsquedas recientes.</li>`;
        return;
    }

    history.slice().reverse().forEach((item, index) => {
        const li = document.createElement("li");
        const expId = `hist-e-${index}`;
        const resId = `hist-r-${index}`;
        
        li.innerHTML = `
            <div style="font-size:12px; opacity:0.6;">Función:</div>
            <div id="${expId}" style="margin: 4px 0;"></div>
            <div style="font-size:12px; opacity:0.6; margin-top:4px;">Solución:</div>
            <div id="${resId}" style="margin-top: 4px; color:#d97706; font-weight:600;"></div>
        `;
        historyList.appendChild(li);

        setTimeout(() => {
            katex.render(item.exp, document.getElementById(expId), { throwOnError: false });
            katex.render(item.result + " + C", document.getElementById(resId), { throwOnError: false });
        }, 0);
    });
}

/* PERSISTENCIA DE BORRADOR AUTOMÁTICO */
input.addEventListener("input", () => sessionStorage.setItem("current_draft", input.value));

window.onload = () => {
    if (sessionStorage.getItem("current_draft")) {
        input.value = sessionStorage.getItem("current_draft");
    }
    loadHistory();
};

/* EXPORTAR PDF REFACTORIZADO (SÓLO EL REPORTE MATEMÁTICO LIMPIO) */
function exportPDF() {
    const reportElement = document.getElementById("pdf-report-container");
    
    // Configuración estética del documento imprimible
    const options = {
        margin:       15,
        filename:     'Reporte_Integrales_El_Alan.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(options).from(reportElement).save();
}