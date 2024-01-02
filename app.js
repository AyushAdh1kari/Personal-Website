function openExpander(imgElem, date, loc) {
    var expander = document.getElementById('photoExpander');
    var expanderImage = document.getElementById('expanderImage');
    var expanderInfo = document.getElementById('expanderInfo');

    expander.style.display = "flex";
    expanderImage.src = imgElem.src;
    expanderInfo.innerHTML = `${date}<br>${loc}`;

    expander.onclick = function(event) {
        if (event.target === expander) {
            closeExpander();
        }
    };
}

function closeExpander() {
    var expander = document.getElementById('photoExpander');
    expander.style.display = "none";
}

