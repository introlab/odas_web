const math = require('mathjs');

const mtx = [
    [ 708.7454, 0,   839.6667],
    [0,  706.1946, 624.0319],
    [0, 0, 1.0000]
];

exports.transform = function(point, scale) {

    let v = [
        point.y,
        -point.x,
        point.z
    ];
    
    let p0 = [0, 0, 1];
    let n = [0, 0, 1];
    
    let k = math.dot(p0,n) / math.dot(v,n);
    
    let pt = v.map(x => x*k);
  	//let pt = v;

    let coord = math.multiply(mtx, pt);

    return { x: coord[0]*scale, y: coord[1]*scale};
}
