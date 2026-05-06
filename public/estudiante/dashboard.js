fetch("http://localhost:3000/estudiante/dashboard", {
    credentials: "include"
})
.then(res => {
    if (res.status === 401) {
        window.location.href = "/login.html";
        return;
    }
    return res.json();
})
.then(data => {

    if (!data) return;

    document.getElementById("bienvenida").textContent =
        "Bienvenido " + data.nombre;

    document.getElementById("grado").textContent = data.grado;
    document.getElementById("seccion").textContent = data.seccion;
    document.getElementById("turno").textContent = data.turno;
});