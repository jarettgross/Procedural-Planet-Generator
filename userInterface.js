document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("seed").value = seed;
    if (!document.getElementById("triangles").checked) {
        document.getElementById("tessellations").setAttribute("max", 6);
        document.getElementById("tessellations").value = 4;
        document.getElementById("tessellations-value").textContent = 4;
    }

    // Set variables then generate planet
    document.getElementById("generate").addEventListener("click", function() {
        if (document.getElementById("seed").value === null || document.getElementById("seed").value === "" || document.getElementById("seed-random").checked) {
            seed     = Math.random();
            document.getElementById("seed").value = seed;
        } else {
            seed     = document.getElementById("seed").value;
        }

        lacunarity   = document.getElementById("lacunarity").value;
        persistance  = document.getElementById("persistance").value;
        octaves      = document.getElementById("octaves").value;
        planetSize   = document.getElementById("size").value;
        tessellation = document.getElementById("tessellations").value;
        minHeight    = Number(document.getElementById("min-height").value);
        maxHeight    = Number(document.getElementById("max-height").value);
        type         = document.querySelector("input[name='type']:checked").value;

        clearScene();
        beginWorker(type, planetSize, tessellation, minHeight, maxHeight, seed, lacunarity, persistance, octaves);
    });

    // Change max tessellation value depending on selected
    var radios = document.querySelectorAll("input[type=radio][name='type']");

    function changeHandler(event) {
        if (this.value !== "NORMAL") {
            document.getElementById("tessellations").setAttribute("max", 6);
            document.getElementById("tessellations").value = 4;
            document.getElementById("tessellations-value").textContent = 4;
        } else {
            document.getElementById("tessellations").setAttribute("max", 500);
            document.getElementById("tessellations").value = 100;
            document.getElementById("tessellations-value").textContent = 100;
        }
    }

    Array.prototype.forEach.call(radios, function(radio) {
        radio.addEventListener("change", changeHandler);
    });

    // Adjust slider values
    document.getElementById("lacunarity").addEventListener("input", function() {
        document.getElementById("lacunarity-value").textContent = document.getElementById("lacunarity").value;
    });

    document.getElementById("persistance").addEventListener("input", function() {
        document.getElementById("persistance-value").textContent = document.getElementById("persistance").value;
    });

    document.getElementById("octaves").addEventListener("input", function() {
        document.getElementById("octaves-value").textContent = document.getElementById("octaves").value;
    });

    document.getElementById("size").addEventListener("input", function() {
        document.getElementById("size-value").textContent = document.getElementById("size").value;
    });

    document.getElementById("tessellations").addEventListener("input", function() {
        document.getElementById("tessellations-value").textContent = document.getElementById("tessellations").value;
    });

    document.getElementById("min-height").addEventListener("input", function() {
        document.getElementById("min-height-value").textContent = document.getElementById("min-height").value;
    });

    document.getElementById("max-height").addEventListener("input", function() {
        document.getElementById("max-height-value").textContent = document.getElementById("max-height").value;
    });
});
