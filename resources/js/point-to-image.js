const math = require('mathjs');

const mtx = [
    [ 701.7255, -1.9998,   941.7793],
    [0, 700.2460, 539.9974],
    [0, 0, 1.0000]
];

exports.transform = function(point, scale) {

    let v = [
        -point.x,
        -point.y,
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
