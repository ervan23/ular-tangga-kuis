'use strict';

(function($) {
    $.fn.removeClassWild = function(mask) {
        return this.removeClass(function(index, cls) {
            var re = mask.replace(/\*/g, '\\S+');
            return (cls.match(new RegExp('\\b' + re + '', 'g')) || []).join(' ');
        });
    };
})(jQuery);

const QUESTION_PER_BLOCK = 3;
var isQuestionModalOpen = false;
var player_should_point = 0;
var dice_audio = new Audio('./assets/sfx/roll_dice.mp3');
var dice_a = 0;
var dice_b = 0;
var dice = 0;
const color = [
    'red','blue','purple','deepPurple','indigo','pink','lightBlue','cyan','teal','green','lightGreen','lime',
    'yellow','amber','orange','deepOrange','brow','grey','blueGrey'
];
const ficha = [
    {
        position: -1,
        point: 0,
        isFinish: false,
    }
];
var turn = 0;
var gameIsFinish = false;
const snakes = {
    snake_16: 4,
    snake_29: 10,
    snake_39: 20,
    snake_45: 34,
};
const laders = {
    lader_6: 14,
    lader_17: 23,
    lader_27: 33,
    lader_38: 43,
}

// loadQuestion();
updatePlayer();
$('#random-dice').attr('disabled', true);
$('.reset-game').attr('disabled', true);

dice_audio.onended = function() {
    $('#roll').attr('checked', false);
    $('#dice-result').text(dice_a + dice_b);

    if(ficha[turn].position === -1) {
        if((dice_a + dice_b) === 6) {
            ficha[turn].position = 0;
            updatePosition(ficha[turn]);
            $('#random-dice').attr('disabled', false);
        } else {
            updateTurn(1);
            $('#random-dice').attr('disabled', false);
        }
    } else {
        randomDiceAndMoveFiche(dice_a, dice_b);
    }
}

$('#random-dice').click(function() {
    $('#roll').attr('checked', true);
    $(this).attr('disabled', true);
    dice_audio.play();
    dice_a = Math.ceil(Math.random() * 6);
    dice_b = 0;//Math.ceil(Math.random() * 6);
});

$('.add-player').click(function() {
    var player = {
        position: -1,
        point: 0,
        isFinish: false,
    }

    ficha.push(player);
    updatePlayer();

    if(ficha.length >= 3) {
        $('button.add-player').attr('disabled', true);
    }
});

$('.start-game').click(function() {
    $('#random-dice').attr('disabled', false);
    $('.reset-game').attr('disabled', false);
    $('.add-player').attr('disabled', true);
    $(this).attr('disabled', true);
});

$('.reset-game').click(function() {
    window.localStorage.clear();
    document.location.reload();
});

function randomDiceAndMoveFiche(a = 0, b = 0) {
    dice = a + b;
    var move = 1;
    
    var anim = setInterval(function() {
        ficha[turn].position += 1;
        updatePosition(ficha[turn]);

        if(ficha[turn].position >= 50 && move !== dice) {
            clearInterval(anim);
            rewindPosition(dice - move);
            return;
        }

        if(move === dice) {
            $('#random-dice').attr('disabled', false);
            var isSnake = snakes['snake_'+ficha[turn].position];
            if (isSnake) {
                ficha[turn].position = isSnake;
            }

            var isLaders = laders['lader_'+ficha[turn].position];
            if (isLaders) {
                ficha[turn].position = isLaders;
            }

            updatePosition(ficha[turn]);

            if(ficha[turn].position === 50) {
                ficha[turn].isFinish = true;
                alert('Player-'+ turn +' winner with point: '+ ficha[turn].point);
                updateTurn(1);
                clearInterval(anim);
                return;
            }

            player_should_point = turn;
            openQuestionModal(ficha[turn]);

            if(dice !== 6) {
                updateTurn(1);
            }

            clearInterval(anim);
        }

        move++;
    }, 250);
}

$('[data-action=modal]').click(function() {
    var target = $(this).data('target');
    window.localStorage.setItem('opened_modal', target);
    $(target).addClass('open');
});

$('[data-action=close]').click(function() {
    var target = window.localStorage.getItem('opened_modal');
    $(target).removeClass('open');
    window.localStorage.removeItem('opened_modal');
    if(isQuestionModalOpen) {
        var point = prompt('Point yang didapat player:');
        point = parseInt(point);
        ficha[player_should_point].point += point;
        updatePlayer(false);
        isQuestionModalOpen = false;
    }
});

function updatePlayer(isUpdatePosition = true) {
    $('.player-list').empty();
    $('#board').empty();
    ficha.map(function(player, index) {
        var wrapper =   '<div class="player '+ color[index] +' '+ (index == turn ? 'active' : '') +'">'+
                            '<p>'+
                                'Player-'+ (index + 1) +':'+
                                '<span class="point">'+ player.point +'</span>'+
                            '</p>'+
                        '</div>';
        $('#board').append('<div id="player-'+index+'" class="ficha '+ color[index] +' position-'+player.position+'"></div>');
        $('.player-list').append(wrapper);

        if(isUpdatePosition) {
            updatePosition(player);
        }
    });
}

function updatePosition(ficha_player = null) {
    $('#player-'+turn).removeClassWild('position-*');
    $('#player-'+turn).addClass('position-'+ (ficha_player.position));
}

function rewindPosition(block = 0) {
    var anim_rewind = setInterval(function() {
        ficha[turn].position -= 1;
        updatePosition(ficha[turn]);

        if(block === 1) {
            $('#random-dice').attr('disabled', false);
            var isSnake = snakes['snake_'+ficha[turn].position];
            if (isSnake) {
                ficha[turn].position = isSnake;
            }

            var isLaders = laders['lader_'+ficha[turn].position];
            if (isLaders) {
                ficha[turn].position = isLaders;
            }

            updatePosition(ficha[turn]);

            if(dice !== 6) {
                updateTurn(1);
            }

            clearInterval(anim_rewind);
        }

        block--;
    }, 250);
}

function updateTurn(number, max = 0) {
    turn = number === 0 ? 0 : (turn + number);

    if(max === 3) {
        gameIsFinish = true;
        $('#random-dice').attr('disabled', true);
        alert('game finished');
        return;
    }

    if(number === 0)
        return;

    if (turn === ficha.length) {
        updateTurn(0, max++);
    }

    if(ficha[turn].isFinish) {
        updateTurn(1, max++);
    }

    $('.player.active').removeClass('active');
    var player_list = document.getElementsByClassName('player');
    $(player_list[turn]).addClass('active');
    
}

function loadQuestion(callback) {   
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', './assets/question/question.json', true); // Replace 'my_data' with the path to your file
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            window.localStorage.setItem('question', xobj.responseText);
          }
    };
    xobj.send(null);  
}

function openQuestionModal(player) {
    if(player.position === 0) {
        return;
    }
    window.localStorage.setItem('opened_modal', '#question-modal');
    var number_question = window.localStorage.getItem('question_'+ player.position);
    if(!number_question) {
        window.localStorage.setItem('question_'+ player.position, '1');
        number_question = 1;
    } else {
        number_question = parseInt(number_question);
        if (number_question >= QUESTION_PER_BLOCK) {
            window.localStorage.setItem('question_'+ player.position, '1');
        } else {
            window.localStorage.setItem('question_'+ player.position, (number_question + 1));
            number_question += 1;
        }
    }

    $('#question-modal').addClass('open');
    $('.question').css('background-image', 'url(./assets/question/'+ player.position +'_'+ number_question +'.png)');
    isQuestionModalOpen = true;
}