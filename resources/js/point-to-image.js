math = require('mathjs');

mtx = [
    [ 1389.6, 0,   995.9],
    [0, 1387.2, 598.5],
    [0, 0, 1.0000]
];

exports.transform = function(point, scale) {

    pt = [
        -point.x,
        -point.y,
        point.z
    ];

    coord = math.multiply(mtx, pt);

    return { x: coord[0]*scale, y: coord[1]*scale};
}
