function showControll(){
    console.log('showControll')
    var modalbox = document.getElementById('modalbox');
    console.log(modalbox)
    modalbox.style.display = 'block';

    showKeyMap();
}


function showKeyMap(){
    document.getElementById('key1_left').innerText= NeskeyMap.BUTTON_UP;
    document.getElementById('key1_right');
    document.getElementById('key1_up');
    document.getElementById('key1_down');
    document.getElementById('key1_a');
    document.getElementById('key1_b');
    document.getElementById('key1_down');
    document.getElementById('key1_select');
}

function closeControllSet(){
    var modalbox = document.getElementById('modalbox');
    modalbox.style.display = 'none';
}

function changeGameColor(){
    if(nes){
        console.log('changeGameColor')
        nes.moyu = !nes.moyu
        nes.reloadROM();
    }
}

function showImgMask(){
    var imgMask = document.getElementById('imgMask');
    imgMask.style.display = "block";
}


function closeMask(){
    var imgMask = document.getElementById('imgMask');
    imgMask.style.display = "none";
}