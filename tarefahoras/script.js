const atividadesPorCategoria = {
    "Extensão": [
        "Projeto de extensão",
        "Atividades culturais",
        "Visitas Técnicas",
        "Visitas a Feiras e Exposições",
        "Cursos de Idiomas",
        "Palestras, Seminários e Congressos Extensionistas (ouvinte)",
        "Palestras, Seminários e Congressos Extensionistas (apresentador)",
        "Projeto Empresa Júnior"
    ],
    "Ensino": [
        "Monitoria",
        "Concursos e campeonatos de atividades acadêmicas",
        "Presença comprovada a defesas de TCC do curso de Engenharia de Computação",
        "Cursos Profissionalizantes Específicos na área",
        "Cursos Profissionalizantes em geral",
        "Estágio Extracurricular"
    ],
    "Pesquisa": [
        "Iniciação Científica",
        "Publicação de artigos em periódicos científicos",
        "Publicação de artigos completos em anais de congressos",
        "Publicação de capítulo de livro",
        "Publicação de resumos de artigos em anais",
        "Registro de patentes como auto/coautor",
        "Premiação resultante de pesquisa científica",
        "Colaborador em atividades como Seminários e Congressos",
        "Palestras, Seminários e Congressos de Pesquisa (ouvinte)",
        "Palestras, Seminários e Congressos de Pesquisa (apresentador)"
    ]
};

const categoriaLimite = { 
    "Extensão": 90,  
    "Ensino": 90,     
    "Pesquisa": 90    
};

const aproveitamentoPorTipo = {
    "Projeto de extensão": 0.10,
    "Atividades culturais": 0.80,
    "Visitas Técnicas": 1.00,
    "Visitas a Feiras e Exposições": 0.20,
    "Cursos de Idiomas": 0.60,
    "Palestras, Seminários e Congressos Extensionistas (ouvinte)": 0.80,
    "Palestras, Seminários e Congressos Extensionistas (apresentador)": 1.00,
    "Projeto Empresa Júnior": 0.20,
    "Monitoria": 0.70,
    "Concursos e campeonatos de atividades acadêmicas": 0.70,
    "Presença comprovada a defesas de TCC do curso de Engenharia de Computação": 0.50,
    "Cursos Profissionalizantes Específicos na área": 0.80,
    "Cursos Profissionalizantes em geral": 0.20,
    "Estágio Extracurricular": 0.70,
    "Iniciação Científica": 0.80,
    "Publicação de artigos em periódicos científicos": 1.00,
    "Publicação de artigos completos em anais de congressos": 1.00,
    "Publicação de capítulo de livro": 1.00,
    "Publicação de resumos de artigos em anais": 1.00,
    "Registro de patentes como auto/coautor": 1.00,
    "Premiação resultante de pesquisa científica": 1.00,
    "Colaborador em atividades como Seminários e Congressos": 1.00,
    "Palestras, Seminários e Congressos de Pesquisa (ouvinte)": 0.80,
    "Palestras, Seminários e Congressos de Pesquisa (apresentador)": 1.00,
};

// Inicializar categoriaHoras
const categoriaHoras = {
    "Extensão": 0,
    "Ensino": 0,
    "Pesquisa": 0
};

const categoriaSelect = document.getElementById("categoria");
const descricaoSelect = document.getElementById("descricao");




categoriaSelect.addEventListener("change", () => {
    const categoria = categoriaSelect.value;
    descricaoSelect.innerHTML = '<option value="" disabled selected>Selecione uma atividade</option>';

    if (atividadesPorCategoria[categoria]) {
        atividadesPorCategoria[categoria].forEach(atividade => {
            const option = document.createElement("option");
            option.value = atividade;
            option.textContent = atividade;
            descricaoSelect.appendChild(option);
        });
        descricaoSelect.disabled = false;
    } else {
        descricaoSelect.disabled = true;
    }
});





document.getElementById("activityForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const descricao = descricaoSelect.value;
    const categoria = categoriaSelect.value;
    const horasTotais = parseInt(document.getElementById("horasTotais").value);

    if (!horasTotais || !descricao || !categoria) {
        alert("Preencha todos os campos corretamente!");
        return;
    }

    const aproveitamento = aproveitamentoPorTipo[descricao] || 1;
    const horasRendidas = horasTotais * aproveitamento;
    const limiteHoras = categoriaLimite[categoria];
    const horasAproveitadasFinal = Math.min(horasRendidas, limiteHoras - categoriaHoras[categoria]);

    // Verificar se a atividade já existe na tabela
    const tableBody = document.querySelector("#resultTable tbody");
    const existingRow = Array.from(tableBody.rows).find(row => {
        const rowCategoria = row.cells[0].textContent;
        const rowDescricao = row.cells[1].textContent;
        return rowCategoria === categoria && rowDescricao === descricao;
    });

    if (existingRow) {
        // Atualizar a linha existente
        const horasExistentes = parseFloat(existingRow.cells[4].textContent);
        const horasAproveitadasExistentes = parseFloat(existingRow.cells[5].textContent);

        const novasHorasTotais = horasExistentes + horasTotais;
        const novasHorasAproveitadas = horasAproveitadasExistentes + horasAproveitadasFinal;

        existingRow.cells[4].textContent = novasHorasTotais.toFixed(2);
        existingRow.cells[5].textContent = novasHorasAproveitadas.toFixed(2);
    } else {
        // Criar uma nova linha
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${categoria}</td>
            <td>${descricao}</td>
            <td>${(aproveitamento * 100).toFixed(2)}%</td>
            <td>${limiteHoras}</td>
            <td>${horasTotais}</td>
            <td>${horasAproveitadasFinal.toFixed(2)}</td>
            <td><button class="delete-btn">Apagar</button></td>
        `;

        tableBody.appendChild(row);

        // Função de apagar linha
        row.querySelector(".delete-btn").addEventListener("click", () => {
            categoriaHoras[categoria] -= horasAproveitadasFinal;
            row.remove();
            atualizarResumoHoras();
        });
    }

    categoriaHoras[categoria] += horasAproveitadasFinal;

    // Resetar o formulário
    document.getElementById("activityForm").reset();
    descricaoSelect.disabled = true;

    // Atualizar total de horas por categoria
    atualizarResumoHoras();
});




function atualizarResumoHoras() {
    // Atualiza os totais por categoria
    document.getElementById("extensaoTotal").textContent = categoriaHoras["Extensão"].toFixed(2);
    document.getElementById("ensinoTotal").textContent = categoriaHoras["Ensino"].toFixed(2);
    document.getElementById("pesquisaTotal").textContent = categoriaHoras["Pesquisa"].toFixed(2);

    // Atualiza o total geral
    const totalGeral = categoriaHoras["Extensão"] + categoriaHoras["Ensino"] + categoriaHoras["Pesquisa"];
    document.getElementById("totalGeral").textContent = totalGeral.toFixed(2);
}
