struct Uniforms {
	start: vec4<f32>,
	end: vec4<f32>,
	angle: f32
};

@group(0) @binding(0) var<uniform> u: Uniforms;

@fragment
fn fs_main(@location(0) tex_coords: vec2<f32>) -> @location(0) vec4<f32> {
    return gradient(tex_coords);
}

fn gradient(uv: vec2<f32>) -> vec4<f32> {
		let angle_rad = radians(u.angle + 270.0);

		let dir = vec2<f32>(cos(angle_rad), sin(angle_rad));

		let proj = dot(uv - 0.5, dir) + 0.5;

		let t = clamp(proj, 0.0, 1.0);

		return mix(vec4<f32>(u.start.rgb, 1.0), vec4<f32>(u.end.rgb, 1.0), t);
}

struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) tex_coords: vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) in_vertex_index: u32) -> VertexOutput {
    var out: VertexOutput;
    let x = f32(i32(in_vertex_index & 1u) * 4 - 1);
    let y = f32(i32(in_vertex_index & 2u) * 2 - 1);
    out.tex_coords = vec2<f32>(x * 0.5 + 0.5, 1.0 - (y * 0.5 + 0.5));
    out.clip_position = vec4<f32>(x, y, 0.0, 1.0);

    return out;
}


// --- Vertex/Fragment connector ---
// struct VertexOutput {
//     @builtin(position) clip_position: vec4<f32>,
//     @location(0) tex_coords: vec2<f32>,
// };

// // ---------------------- Simplex 3D Noise ----------------------
// fn permute(x: vec4<f32>) -> vec4<f32> {
//     return mod(((x * 34.0) + vec4<f32>(1.0)) * x, vec4<f32>(289.0));
// }
// fn taylorInvSqrt(r: vec4<f32>) -> vec4<f32> {
//     return vec4<f32>(1.79284291400159) - vec4<f32>(0.85373472095314) * r;
// }

// fn snoise(v: vec3<f32>) -> f32 {
//     let C = vec2<f32>(1.0 / 6.0, 1.0 / 3.0);
//     let D = vec4<f32>(0.0, 0.5, 1.0, 2.0);

//     var i: vec3<f32> = floor(v + dot(v, vec3<f32>(C.y)));
//     var x0: vec3<f32> = v - i + dot(i, vec3<f32>(C.x));

//     let g = step(x0.yzx, x0.xyz);
//     let l = vec3<f32>(1.0) - g;
//     let i1 = min(g, l.zxy);
//     let i2 = max(g, l.zxy);

//     let x1 = x0 - i1 + vec3<f32>(C.x);
//     let x2 = x0 - i2 + vec3<f32>(2.0 * C.x);
//     let x3 = x0 - vec3<f32>(1.0) + vec3<f32>(3.0 * C.x);

//     i = mod(i, vec3<f32>(289.0));
//     var p = permute(permute(permute(vec4<f32>(i.z, i.z + i1.z, i.z + i2.z, i.z + 1.0))
//                     + vec4<f32>(i.y, i.y + i1.y, i.y + i2.y, i.y + 1.0))
//                     + vec4<f32>(i.x, i.x + i1.x, i.x + i2.x, i.x + 1.0));

//     let n = 1.0 / 7.0;
//     let ns = n * D.wyz - D.xzx;

//     let j = p - vec4<f32>(49.0) * floor(p * ns.z * ns.z);

//     let x_ = floor(j * ns.z);
//     let y_ = floor(j - vec4<f32>(7.0) * x_);

//     let x = x_ * ns.x + ns.yyyy;
//     let y = y_ * ns.x + ns.yyyy;
//     let h = vec4<f32>(1.0) - abs(x) - abs(y);

//     let b0 = vec4<f32>(x.xy, y.xy);
//     let b1 = vec4<f32>(x.zw, y.zw);

//     let s0 = floor(b0) * 2.0 + vec4<f32>(1.0);
//     let s1 = floor(b1) * 2.0 + vec4<f32>(1.0);
//     let sh = -step(h, vec4<f32>(0.0));

//     let a0 = b0.xzyw + s0.xzyw * sh.xxyy;
//     let a1 = b1.xzyw + s1.xzyw * sh.zzww;

//     let p0 = vec3<f32>(a0.xy, h.x);
//     let p1 = vec3<f32>(a0.zw, h.y);
//     let p2 = vec3<f32>(a1.xy, h.z);
//     let p3 = vec3<f32>(a1.zw, h.w);

//     var norm = taylorInvSqrt(vec4<f32>(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
//     p0 = p0 * norm.x;
//     p1 = p1 * norm.y;
//     p2 = p2 * norm.z;
//     p3 = p3 * norm.w;

//     var m = max(vec4<f32>(0.6) - vec4<f32>(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), vec4<f32>(0.0));
//     m = m * m;
//     return 42.0 * dot(m * m, vec4<f32>(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
// }

// // ---------------------- uvCover ----------------------
// fn uvCover(uv: vec2<f32>, size: vec2<f32>, resolution: vec2<f32>) -> vec2<f32> {
//     let s = resolution;
//     let i = size;

//     let rs = s.x / s.y;
//     let ri = i.x / i.y;
//     let new = select(vec2<f32>(i.x * s.y / i.y, s.y), vec2<f32>(s.x, i.y * s.x / i.x), rs >= ri);
//     let offset = select(vec2<f32>((new.x - s.x) / 2.0, 0.0), vec2<f32>(0.0, (new.y - s.y) / 2.0), rs >= ri) / new;

//     return uv * s / new + offset;
// }

// // ---------------------- Vertex shader ----------------------
// @vertex
// fn vs_main(@builtin(vertex_index) vertex_index: u32) -> VertexOutput {
//     var out: VertexOutput;

//     // Fullscreen quad positions from vertex index
//     let pos = array<vec2<f32>, 6>(
//         vec2<f32>(-1.0, -1.0),
//         vec2<f32>( 1.0, -1.0),
//         vec2<f32>(-1.0,  1.0),
//         vec2<f32>(-1.0,  1.0),
//         vec2<f32>( 1.0, -1.0),
//         vec2<f32>( 1.0,  1.0)
//     );

//     let uv = (pos[vertex_index] + vec2<f32>(1.0)) * 0.5;
//     out.tex_coords = uv;

//     // Hard-coded time
//     let time = 1.5;

//     // Apply vertex noise displacement in Z
//     let modifiedCoord = uv * vec2<f32>(3.0, 4.0);
//     let distortion = max(0.0, snoise(vec3<f32>(modifiedCoord.x + time * 0.5, modifiedCoord.y, time)));
//     let newPos = vec3<f32>(pos[vertex_index], distortion);

//     out.clip_position = vec4<f32>(newPos, 1.0);
//     return out;
// }

// // ---------------------- Fragment shader ----------------------
// @fragment
// fn fs_main(@location(0) tex_coords: vec2<f32>) -> @location(0) vec4<f32> {
//     // Hard-coded parameters
//     let imageSize = vec2<f32>(800.0, 600.0);
//     let screenSize = vec2<f32>(1280.0, 720.0);
//     let amplitude = 0.5;
//     let time = 1.5;

//     let colors = array<vec3<f32>, 3>(
//         vec3<f32>(1.0, 0.2, 0.3),
//         vec3<f32>(0.2, 0.8, 0.4),
//         vec3<f32>(0.2, 0.4, 1.0)
//     );

//     let uv = uvCover(tex_coords, imageSize, screenSize);
//     var centeredUv = uv * 2.0 - vec2<f32>(1.0);

//     centeredUv = centeredUv + amplitude * 0.4 * sin(1.0 * centeredUv.yx + vec2<f32>(1.2, 3.4) + time);
//     centeredUv = centeredUv + amplitude * 0.2 * sin(5.2 * centeredUv.yx + vec2<f32>(3.5, 0.4) + time);
//     centeredUv = centeredUv + amplitude * 0.3 * sin(3.5 * centeredUv.yx + vec2<f32>(1.2, 3.1) + time);
//     centeredUv = centeredUv + amplitude * 1.6 * sin(0.4 * centeredUv.yx + vec2<f32>(0.8, 2.4) + time);

//     var baseColor = colors[0];
//     for (var i: i32 = 0; i < 3; i = i + 1) {
//         let r = cos(f32(i) * length(centeredUv));
//         let noiseVec = vec3<f32>(r, r, r);
//         baseColor = mix(baseColor, colors[i], noiseVec);
//     }

//     return vec4<f32>(baseColor, 1.0);
// }
