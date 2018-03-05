const math = require('mathjs');

const mtx = [
    [337.1690, 0, 316.2955],
        [0,  336.4553,  243.2880],
        [0,         0,    1.0000]
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
