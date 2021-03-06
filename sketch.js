var model;
var dx, dy; // offsets of the pen strokes, in pixels
var pen_down, pen_up, pen_end; // keep track of whether pen is touching paper
var x, y; // absolute coordinates on the screen of where the pen is
var prev_pen = [1, 0, 0]; // group all p0, p1, p2 together
var rnn_state; // store the hidden states of rnn's neurons
var pdf; // store all the parameters of a mixture-density distribution
var temperature = 0.65; // controls the amount of uncertainty of the model
var line_color;

var setup = function() {
  model = new SketchRNN(model_data); // assume we have a model_data
  p.createCanvas(screen_width, screen_height);
  p.frameRate(60);

  // initialize the scale factor for the model. Bigger -> large outputs
  model.set_pixel_factor(2.0);

  // initialize pen's states to zero.
  [dx, dy, pen_down, pen_up, pen_end] = model.zero_input(); // the pen's states

  // zero out the rnn's initial states
  rnn_state = model.zero_state();

  // define color of line
  line_color = p.color(p.random(64, 224), p.random(64, 224), p.random(64, 224));
};

var draw = function() {
  // see if we finished drawing
  if (prev_pen[2] == 1) {
    p.noLoop(); // stop drawing
    return;
  }

  // using the previous pen states, and hidden state, get next hidden state
  // the below line takes the most CPU power, especially for large models.
  rnn_state = model.update([dx, dy, pen_down, pen_up, pen_end], rnn_state);

  // get the parameters of the probability distribution (pdf) from hidden state
  pdf = model.get_pdf(rnn_state);

  // sample the next pen's states from our probability distribution
  [dx, dy, pen_down, pen_up, pen_end] = model.sample(pdf, temperature);

  // only draw on the paper if the pen is touching the paper
  if (prev_pen[0] == 1) {
    p.stroke(line_color);
    p.strokeWeight(2.0);
    p.line(x, y, x+dx, y+dy); // draw line connecting prev point to current point.
  }

  // update the absolute coordinates from the offsets
  x += dx;
  y += dy;

  // update the previous pen's state to the current one we just sampled
  prev_pen = [pen_down, pen_u