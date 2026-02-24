document.addEventListener("DOMContentLoaded", function () {

    fetch("http://localhost:8080/api/camion/estados")
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al obtener estados");
            }
            return response.json();
        })
        .then(data => {
            const select = document.getElementById("estadoSelect");

            data.forEach(estado => {
                const option = document.createElement("option");
                option.value = estado;
                option.textContent = estado.replace("_", " ");
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Error:", error);
        });

});