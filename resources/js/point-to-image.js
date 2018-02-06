math = require('mathjs');

mtx = [
    [  788.9292, 0, 329.4620],
    [0, 785.3060, 229.3576],
    [0, 0, 1.0000]
];

exports.transform = function(point) {

    pt = [
        -point.x,
        -point.y,
        point.z
    ];

    coord = math.multiply(mtx, pt);

    return { x: coord[0], y: coord[1]};
}
