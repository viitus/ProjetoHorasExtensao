// Importando os módulos necessários do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBDy4Jkd3TGjw7Ti7j04Sx3DKlB2M1Rouw",
    authDomain: "extensao-9f20c.firebaseapp.com",
    projectId: "extensao-9f20c",
    storageBucket: "extensao-9f20c.appspot.com",
    messagingSenderId: "382935632026",
    appId: "1:382935632026:web:2cebc99b440e667f22b723",
    measurementId: "G-WZE90SBMPK"
};

// Inicializa o Firebase e Firestore
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);


// Classe para representar uma atividade
class Atividade {
    constructor(categoria, descricao, horasTotais, aproveitamento, limiteHoras) {
        this.categoria = categoria;
        this.descricao = descricao;
        this.horasTotais = horasTotais;
        this.aproveitamento = aproveitamento;
        this.limiteHoras = limiteHoras;
        this.horasRendidas = Math.min(horasTotais * aproveitamento, limiteHoras);
    }
}

// Classe para representar uma categoria
class Categoria {
    constructor(nome) {
        this.nome = nome;
        this.limiteHoras = 90;
        this.totalHoras = 0;
        this.totalHorasRendidas = 0;
        this.atividades = [];
    }

    adicionarAtividade(atividade) {
        if (this.atividades.some(a => a.descricao === atividade.descricao)) {
            alert("Esta atividade já foi adicionada.");
            return false;
        }
        this.totalHoras += atividade.horasTotais;
        const novasHorasRendidas = this.totalHorasRendidas + atividade.horasRendidas;
        this.totalHorasRendidas = Math.min(novasHorasRendidas, this.limiteHoras);
        this.atividades.push(atividade);
        atualizarResumoHoras()
        return true;
    }

    removerAtividade(atividade) {
        this.totalHoras -= atividade.horasTotais;
        this.atividades = this.atividades.filter(a => a !== atividade);
        this.totalHorasRendidas = Math.min(
            this.atividades.reduce((sum, a) => sum + a.horasRendidas, 0),
            this.limiteHoras
        );
        atualizarResumoHoras()
    }

    getTotalHoras() {
        return this.totalHorasRendidas;
    }
}

// Inicialização das categorias
const categorias = {
    "Extensão": new Categoria("Extensão"),
    "Ensino": new Categoria("Ensino"),
    "Pesquisa": new Categoria("Pesquisa")
};

// Dados sobre atividades disponíveis
const atividadesPorCategoria = {
    "Extensão": [
        { descricao: "Projeto de extensão", aproveitamento: 0.10, limiteHoras: 50 },
        { descricao: "Atividades culturais", aproveitamento: 0.80, limiteHoras: 30 },
        { descricao: "Visitas Técnicas", aproveitamento: 1.00, limiteHoras: 20 },
        { descricao: "Visitas a Feiras e Exposições", aproveitamento: 0.20, limiteHoras: 15 },
        { descricao: "Cursos de Idiomas", aproveitamento: 0.60, limiteHoras: 30 },
        { descricao: "Palestras, Seminários e Congressos Extensionistas (ouvinte)", aproveitamento: 0.80, limiteHoras: 25 },
        { descricao: "Palestras, Seminários e Congressos Extensionistas (apresentador)", aproveitamento: 1.00, limiteHoras: 50 },
        { descricao: "Projeto Empresa Júnior", aproveitamento: 0.20, limiteHoras: 50 }
    ],
    "Ensino": [
        { descricao: "Monitoria", aproveitamento: 0.70, limiteHoras: 60 },
        { descricao: "Concursos e campeonatos de atividades acadêmicas", aproveitamento: 0.70, limiteHoras: 40 },
        { descricao: "Presença comprovada a defesas de TCC do curso de Engenharia de Computação", aproveitamento: 0.50, limiteHoras: 20 },
        { descricao: "Cursos Profissionalizantes Específicos na área", aproveitamento: 0.80, limiteHoras: 40 },
        { descricao: "Cursos Profissionalizantes em geral", aproveitamento: 0.20, limiteHoras: 50 },
        { descricao: "Estágio Extracurricular", aproveitamento: 0.70, limiteHoras: 80 }
    ],
    "Pesquisa": [
        { descricao: "Iniciação Científica", aproveitamento: 0.80, limiteHoras: 50 },
        { descricao: "Publicação de artigos em periódicos científicos", aproveitamento: 1.00, limiteHoras: 60 },
        { descricao: "Publicação de artigos completos em anais de congressos", aproveitamento: 1.00, limiteHoras: 60 },
        { descricao: "Publicação de capítulo de livro", aproveitamento: 1.00, limiteHoras: 60 },
        { descricao: "Publicação de resumos de artigos em anais", aproveitamento: 1.00, limiteHoras: 50 },
        { descricao: "Registro de patentes como autor/coautor", aproveitamento: 1.00, limiteHoras: 70 },
        { descricao: "Premiação resultante de pesquisa científica", aproveitamento: 1.00, limiteHoras: 30 },
        { descricao: "Colaborador em atividades como Seminários e Congressos", aproveitamento: 1.00, limiteHoras: 40 },
        { descricao: "Palestras, Seminários e Congressos de Pesquisa (ouvinte)", aproveitamento: 0.80, limiteHoras: 30 },
        { descricao: "Palestras, Seminários e Congressos de Pesquisa (apresentador)", aproveitamento: 1.00, limiteHoras: 50 }
    ]
};

// Elementos DOM
const categoriaSelect = document.getElementById("categoria");
const descricaoSelect = document.getElementById("descricao");
const form = document.getElementById("activityForm");
const resultTableBody = document.querySelector("#resultTable tbody");

// Atualiza atividades ao selecionar categoria
categoriaSelect.addEventListener("change", () => {
    const categoria = categoriaSelect.value;
    descricaoSelect.innerHTML = '<option value="" disabled selected>Selecione uma atividade</option>';

    if (atividadesPorCategoria[categoria]) {
        atividadesPorCategoria[categoria].forEach(atividade => {
            const option = document.createElement("option");
            option.value = JSON.stringify(atividade);
            option.textContent = atividade.descricao;
            descricaoSelect.appendChild(option);
        });
        descricaoSelect.disabled = false;
    } else {
        descricaoSelect.disabled = true;
    }
});

// Adiciona atividade ao Firestore e tabela
form.addEventListener("submit", async(event) => {
    event.preventDefault();
    const categoria = categoriaSelect.value;
    const atividadeData = JSON.parse(descricaoSelect.value);
    const horasTotais = parseInt(document.getElementById("horasTotais").value);

    const atividade = new Atividade(
        categoria,
        atividadeData.descricao,
        horasTotais,
        atividadeData.aproveitamento,
        atividadeData.limiteHoras
    );

    try {
        await addDoc(collection(db, "atividades"), {
            categoria: atividade.categoria,
            descricao: atividade.descricao,
            horasTotais: atividade.horasTotais,
            aproveitamento: atividade.aproveitamento,
            limiteHoras: atividade.limiteHoras,
            horasRendidas: atividade.horasRendidas
        });
        categorias[categoria].adicionarAtividade(atividade);
        atualizarTabela(atividade);
        atualizarResumoHoras();
        form.reset();
        descricaoSelect.disabled = true;
    } catch (error) {
        console.error("Erro ao salvar: ", error);
    }
});


// Carrega atividades salvas do Firestore
async function carregarAtividades() {
    const querySnapshot = await getDocs(collection(db, "atividades"));
    
    // Limpa as atividades existentes nas categorias
    categorias["Extensão"].atividades = [];
    categorias["Ensino"].atividades = [];
    categorias["Pesquisa"].atividades = [];

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const atividade = new Atividade(
            data.categoria, data.descricao, data.horasTotais,
            data.aproveitamento, data.limiteHoras
        );

        // Adiciona a atividade à categoria correta
        categorias[atividade.categoria].adicionarAtividade(atividade);
        atualizarTabela(atividade, doc.id);
    });

    // Atualiza o resumo de horas após carregar as atividades
    atualizarResumoHoras();
}





// Atualiza a tabela de atividades
// Atualiza a tabela de atividades
function atualizarTabela(atividade, docId = null) {
    const row = document.createElement("tr");
    row.dataset.id = docId; // Atribui o ID do documento ao atributo data-id da linha
    row.innerHTML = `
        <td>${atividade.categoria}</td>
        <td>${atividade.descricao}</td>
        <td>${(atividade.aproveitamento * 100).toFixed(2)}%</td>
        <td>${atividade.limiteHoras}</td>
        <td>${atividade.horasTotais}</td>
        <td>${atividade.horasRendidas.toFixed(2)}</td>
        <td><button class="delete-btn">Apagar</button></td>
    `;
    resultTableBody.appendChild(row);
    // Evento para remover a atividade
    row.querySelector(".delete-btn").addEventListener("click", async () => {
        if (confirm("Tem certeza que deseja apagar esta atividade?")) {
            try {
                if (docId) {
                    await deleteDoc(doc(db, "atividades", docId));
                }
                // Remover a atividade da categoria correta usando atividade.categoria
                categorias[atividade.categoria].removerAtividade(atividade);
                row.remove(); // Remove a linha da tabela
                atualizarResumoHoras(); // Atualiza o resumo de horas
            } catch (error) {
                console.error("Erro ao deletar atividade: ", error);
            }
        }
    });
}




// Atualiza resumo de horas
function atualizarResumoHoras() {
    document.getElementById("extensaoTotalHoras").textContent = categorias["Extensão"].totalHoras.toFixed(2);
    document.getElementById("extensaoHorasRendidas").textContent = categorias["Extensão"].getTotalHoras().toFixed(2);

    document.getElementById("ensinoTotalHoras").textContent = categorias["Ensino"].totalHoras.toFixed(2);
    document.getElementById("ensinoHorasRendidas").textContent = categorias["Ensino"].getTotalHoras().toFixed(2);

    document.getElementById("pesquisaTotalHoras").textContent = categorias["Pesquisa"].totalHoras.toFixed(2);
    document.getElementById("pesquisaHorasRendidas").textContent = categorias["Pesquisa"].getTotalHoras().toFixed(2);

    const totalGeralHoras = categorias["Extensão"].totalHoras + categorias["Ensino"].totalHoras + categorias["Pesquisa"].totalHoras;
    const totalGeralRendidas = categorias["Extensão"].getTotalHoras() + categorias["Ensino"].getTotalHoras() + categorias["Pesquisa"].getTotalHoras();

    document.getElementById("totalGeralHoras").textContent = totalGeralHoras.toFixed(2);
    document.getElementById("totalGeralRendidas").textContent = totalGeralRendidas.toFixed(2);
}


window.onload = carregarAtividades;