# RF Signal Processing: presentation outline

Generated from `src/content.js`. Edit that file and run `node src/build_outline.js`; the same file drives the slide deck.

Audience: mixed (RF experts and newcomers). Every content slide has a plain-language idea, an everyday analogy ("think of it like this"), a small numeric example, and the equation. Expert-level detail is in the speaker notes and the appendix. Duration: about 90 minutes including recaps and questions.

## Timing

| Part | Minutes | Slides |
|---|---:|---:|
| Opening | 6 | 4 |
| Part 1 · What an RF signal is | 15 | 8 |
| Part 2 · Sampling: from a wave to numbers | 12 | 6 |
| Part 3 · Inside the ADC | 20 | 12 |
| Part 4 · FFT and IFFT | 25 | 10 |
| Part 5 · Putting it together | 12 | 5 |
| Appendix · for the RF engineers | 0 | 6 |
| **Total** | **90** | **51** |

## Opening (6 min)

### Slide 1 · RF Signal Processing · 1 min

*How a radio wave becomes numbers, and what we do with them*

**Speaker notes**

Welcome. This talk is for two groups at once: people who design radio systems every day, and people who have never heard the word "spectrum". Promise to both: beginners will leave able to read an ADC datasheet and an FFT plot; experts will find the derivations and design trade-offs in the speaker notes and the appendix.

### Slide 2 · Agenda and what you will be able to do · 2 min

**Slide content**

- Part 1 · What an RF signal is: waves, decibels, I and Q, noise, link budget (15 min)
- Part 2 · Sampling: turning a smooth wave into a list of numbers (12 min)
- Part 3 · Inside the ADC: how a chip turns a voltage into a binary number (20 min)
- Part 4 · FFT and IFFT: finding the frequencies inside a signal, and going back (25 min)
- Part 5 · One complete example, Wi-Fi and 5G, common mistakes (12 min)

**After this talk you can**

- Work out how fast an ADC must sample and how accurate it is
- Explain, step by step, what an ADC does in each clock tick
- Read an FFT plot: which peak is which frequency, and how fine the detail is
- Say why the FFT is fast and where Wi-Fi and 5G use it

**Speaker notes**

Set expectations. Every slide follows the same recipe: a picture or chart, a plain-language idea, an everyday comparison ("think of it like this"), a small example with real numbers, and only then the equation. Recap slides at the end of each part are where beginners should check they are still with us. Experts: the deeper material is in the notes and in the appendix at the end. Total about 90 minutes including questions.

### Slide 3 · The big picture: from antenna to data · 2 min

**Slide content**

- Antenna: catches the radio wave and turns it into a tiny voltage (millionths of a volt)
- LNA (low-noise amplifier): makes the tiny voltage bigger without adding much hiss
- Mixer: slows the signal down from billions of cycles per second to millions
- Filter: throws away everything outside the channel we want
- ADC (analog-to-digital converter): measures the voltage and writes it down as numbers
- DSP (digital signal processing): maths on the numbers, for example the FFT, to get the data out

**Think of it like this.** A receiver is a translator. The antenna hears a whisper, the LNA turns up the volume, the mixer slows the speech down, the filter blocks background chatter, the ADC writes it all down as numbers, and the DSP reads the notes.

**Example · Your phone on Wi-Fi**

- 2.4 GHz wave arrives at −60 dBm (a billionth of a milliwatt)
- Mixed down to 10 MHz; 40 million 12-bit readings per second
- A 1024-point FFT finds the channel; DSP decodes the page

**Speaker notes**

This diagram comes back at the start of every part as a "you are here" marker. Experts: the ADC is the boundary between analog and digital. Everything before it is a physics problem, everything after it is maths.

### Slide 4 · Eight words we will use all the time · 1 min

| Word | Plain meaning | Everyday comparison |
|---|---|---|
| Signal | A voltage that changes over time and carries information | The sound of a voice |
| Frequency (Hz) | How many times per second the wave repeats | Pitch of a musical note |
| Spectrum | A chart of how much of each frequency a signal contains | The notes in a chord, listed |
| Sample | One measurement of the voltage at one instant | One frame of a film |
| Bit | One binary digit, 0 or 1; more bits = finer measurement | More marks on a ruler |
| dB (decibel) | A way of writing ratios so that × becomes + | Counting zeros instead of writing them |
| Noise | Random hiss added to every real signal | Static between radio stations |
| Bandwidth | The range of frequencies a signal occupies | Width of a lane on a motorway |

**Speaker notes**

Spend one minute here for the newcomers; experts can relax. Every other term in the talk is built from these eight. Point out that the "everyday comparison" column is exactly how the analogies on later slides will work.

## Part 1 · What an RF signal is (15 min)

### Slide 5 · Part 1 · What an RF signal is

*Waves, decibels, I and Q, noise, and whether the signal will arrive*

**Speaker notes**

You are here: antenna, LNA, mixer. Keep it brisk for the experts, but the I/Q slide is the one beginners must not miss.

### Slide 6 · An RF signal is a very fast wave · 3 min

**Slide content**

- RF means radio frequency: waves repeating thousands to billions of times per second
- The wave itself carries nothing; information is added by changing its height, speed or timing
- Chart: two waves with the same frequency but different height and starting point

**Think of it like this.** A wave is a spinning bicycle wheel seen from the side. A is the wheel size, f is how many turns per second, and φ is where the valve was when you started watching.

**Example · Wi-Fi at 2.4 GHz**

- 2.4 GHz = 2 400 000 000 repeats per second
- One repeat takes 1 / 2.4e9 = 0.42 nanoseconds
- Wavelength = 3e8 / 2.4e9 = 12.5 cm: a Wi-Fi antenna length

**Equations**

- `x(t) = A · cos(2π f t + φ)`  
  A = height, f = repeats per second, φ = where the wave starts
- `λ = c / f`  
  Wavelength: how far the wave travels in one repeat (c = speed of light)

**Speaker notes**

Ask the room: how long is one cycle at 2.4 GHz? 0.42 ns. Light travels 12.5 cm in that time, which is why Wi-Fi antennas are about that long. Beginners only need: three knobs, A, f, φ. Everything in the talk changes one of these three.

> **For the experts (notes and appendix only).** Real signals are bandpass: a carrier at fc with information spread over a bandwidth B ≪ fc. That separation of scales is what makes downconversion and complex baseband possible.

### Slide 7 · Decibels: counting zeros instead of writing them · 2 min

| Power | dBm | Where you meet it |
|---|---|---|
| 1 W | +30 dBm | A phone transmitting at full power |
| 1 mW | 0 dBm | The reference point |
| 1 µW | −30 dBm | Strong Wi-Fi, same room as the router |
| 1 pW | −90 dBm | Weak Wi-Fi, two walls away |
| 0.1 fW | −130 dBm | GPS satellite signal at your phone |

**Think of it like this.** Radio powers span from watts to billionths of a billionth of a watt. Instead of writing all the zeros, dB counts them: every 10 dB is one more zero, and multiplying becomes adding.

**Example · Router to laptop**

- Router sends 100 mW = +20 dBm
- The air between them loses 74 dB
- Laptop receives +20 − 74 = −54 dBm (that is 4 nanowatts)

**Equations**

- `P(dBm) = 10 · log₁₀( P / 1 mW )`  
  Power compared with 1 milliwatt
- `gain (dB) = 10 · log₁₀( P_out / P_in )`  
  How much bigger the power got

**Speaker notes**

Three numbers to memorise: ×2 = +3 dB, ×10 = +10 dB, ×1000 = +30 dB. Everything else is a sum of these. Walk the table top to bottom: each row is a real thing they have used.

> **For the experts (notes and appendix only).** Voltage ratios use 20 log₁₀ because power goes as V². That form assumes equal source and load impedance; mixing 10 log (power) and 20 log (voltage) is the most common dB mistake in link budgets.

### Slide 8 · Putting information on the wave · 2 min

**Slide content**

- Changing the height is AM (amplitude modulation); changing the timing is FM or PM
- Digital radios pick from a fixed menu of (I, Q) pairs; each pair stands for a few bits
- Chart: the slow I and Q signals (coloured) and the fast wave they produce (grey)

**Think of it like this.** A flashlight beam is the carrier. You can send a message by making it brighter and dimmer (AM), or by wiggling it left and right in time (PM). I and Q are the two hands that do the wiggling.

**Example · QPSK: 2 bits per symbol**

- Menu of four (I, Q) pairs: (+1,+1) (−1,+1) (−1,−1) (+1,−1)
- Each pair = 2 bits, so bits 00, 01, 11, 10
- A new pair every microsecond → 2 million bits per second

**Equations**

- `x(t) = A(t) · cos(2π f_c t + φ(t))`  
  Change the height A(t) or the timing φ(t) to carry information
- `x(t) = I(t) · cos(ω_c t) − Q(t) · sin(ω_c t)`  
  Any change at all can be made from two slow signals, I and Q

**Speaker notes**

The second equation is the most important one for understanding radios: two slow signals, I and Q, multiplied by a cosine and a sine, can make any wiggle at all. Beginners: I and Q are just two numbers that describe the wave right now: how tall and how shifted.

> **For the experts (notes and appendix only).** The I/Q form is the trigonometric expansion of A·cos(ωt + φ) with I = A cos φ and Q = A sin φ. Every modern transceiver implements exactly this equation in hardware: two DACs, two mixers, one 90° phase shifter.

### Slide 9 · Why we do not have to measure the fast wave · 3 min

**Slide content**

- The mixer multiplies the fast wave by a cosine and a sine of the carrier; what is left is slow I and Q
- Left chart: energy at the carrier (bin 20). Right chart: after mixing, the same information sits around 0

**Think of it like this.** Filming a spinning ceiling fan with a camera that spins at the same speed: the blades look still, and only the small wobbles remain. Mixing "spins the camera" at the carrier frequency so only the slow message is left to record.

**Example · Why the ADC can be slow**

- Wi-Fi carrier: 2.4 GHz. Channel width: 20 MHz
- Measuring the wave itself: > 4.8 billion readings/s
- Measuring I and Q: about 20 million readings/s each

**Equations**

- `x(t) = Re{ (I + jQ) · e^{ jω_c t } }`  
  The fast wave = a slow pair (I, Q) spinning at the carrier frequency
- `e^{jθ} = cos θ + j sin θ`  
  Euler: one complex number holds both a cosine and a sine

*Chart:* Left: the radio signal at the carrier. Right: after I/Q mixing the same information sits at low frequency, where the ADC can handle it.

**Speaker notes**

This slide answers the newcomer question "how can a chip possibly measure a 2.4 GHz wave?" Answer: it does not. It measures how the wave differs from a perfect 2.4 GHz reference, and those differences are slow. Chart: carrier at bin 20 on the left; after mixing and low-pass filtering, the energy is at 0 ± 2 on the right.

> **For the experts (notes and appendix only).** Negative frequencies are real in complex baseband: an offset of −1 MHz from fc is a distinct signal from +1 MHz. Image rejection depends on I/Q gain and phase balance: IRR ≈ −10 log₁₀((ε² + Δφ²)/4).

### Slide 10 · Noise: the hiss under every signal · 3 min

**Slide content**

- Every warm object hisses; a wider channel collects more hiss
- Each stage in the receiver adds its own noise; putting the quiet amplifier first hides the noise of everything after it

**Think of it like this.** Listening to a friend in a busy café. The chatter (noise) is fixed; the wider you open your ears (bandwidth) the more chatter you hear. Leaning in first (the LNA) helps far more than turning up your hearing aid later.

**Example · Wi-Fi 20 MHz channel**

- 20 MHz = 73 dB-Hz of bandwidth (10·log₁₀ 20 000 000 = 73)
- Noise floor = −174 + 73 = −101 dBm
- Signal at −54 dBm → SNR = 47 dB: plenty

**Equations**

- `N = k · T · B   →   −174 dBm/Hz at room temperature`  
  Every 1 Hz of bandwidth collects the same tiny hiss power
- `SNR = P_signal / P_noise`  
  Signal-to-noise ratio: how far the signal stands above the hiss
- `F_total = F₁ + (F₂ − 1)/G₁ + (F₃ − 1)/(G₁G₂) + …`  
  Friis: the first amplifier decides most of the total noise

**Speaker notes**

Beginners need two things: the noise floor number for their channel, and "LNA first". Do the Friis example with the experts in the room: swapping LNA and mixer order costs 7 dB.

> **For the experts (notes and appendix only).** Friis uses linear ratios, not dB. A 3 dB NF LNA with 20 dB gain in front of a 10 dB NF mixer gives F = 2 + (10 − 1)/100 = 2.09 → 3.2 dB. Swap the order and NF jumps to nearly 10 dB.

### Slide 11 · Link budget: will the signal arrive? · 2 min

| Item | Value | Comment |
|---|---|---|
| Transmit power | +20 dBm | Wi-Fi router |
| Antenna gains | +2 + 2 dBi | Small antennas both ends |
| Path loss, 50 m, 2.4 GHz | −74 dB | 20log(0.05) + 20log(2400) + 32.44 |
| Received power | −50 dBm | Above the −101 dBm noise floor |
| Signal-to-noise | ≈ 51 dB | Enough for the fastest Wi-Fi rates |

**Think of it like this.** Shouting across a field: how loud you shout, minus how far the sound fades, plus how good the listener's ears are, equals what they hear. If that is above the wind noise, the message gets through.

**Example · Move 100 m away instead of 50 m**

- Distance doubles → path loss +6 dB → −80 dB
- Received power −56 dBm, SNR 45 dB
- Still fine; at 1 km it would be −76 dBm and struggling

**Equations**

- `P_rx = P_tx + G_tx + G_rx − FSPL`  
  Received = sent + antenna gains − path loss (all in dB)
- `FSPL(dB) = 20 log₁₀(d_km)     + 20 log₁₀(f_MHz) + 32.44`  
  Free-space path loss: doubling distance or frequency costs 6 dB

**Speaker notes**

Do the arithmetic on the slide out loud; it is all addition and subtraction. Then do the example: doubling the distance costs 6 dB.

> **For the experts (notes and appendix only).** FSPL grows 6 dB per doubling of distance and 6 dB per doubling of frequency, which is why mmWave 5G needs beamforming gain to close the same link.

### Slide 12 · Recap · Part 1 · 1 min

**Slide content**

- An RF signal is a fast wave with three knobs: height A, frequency f, timing φ
- dB counts zeros: ×10 = +10 dB, ×2 = +3 dB; dBm is power compared with 1 mW
- Any message can be carried by two slow signals, I and Q
- Noise floor = −174 dBm/Hz + bandwidth in dB; put the quiet amplifier first
- Link budget: sent + gains − path loss = received; check it beats the noise floor

**Speaker notes**

Pause for questions from the beginner side of the room. Check: can everyone say in one sentence what I and Q are?

## Part 2 · Sampling: from a wave to numbers (12 min)

### Slide 13 · Part 2 · Sampling

*Turning a smooth wave into a list of numbers, without losing anything*

**Speaker notes**

You are here: the filter and the door of the ADC. This part explains why the filter must come before the ADC.

### Slide 14 · Sampling: take a reading every T_s seconds · 3 min

**Slide content**

- A computer cannot store a smooth curve, only a list of numbers
- Between two readings the computer knows nothing; the trick is to read often enough
- Chart: a 1 kHz wave read 12 000 times a second; the black stems are all the computer ever sees

**Think of it like this.** A film camera takes 24 still pictures every second and your brain fills in the motion. Sampling does the same with a voltage: still snapshots, taken at a fixed rate.

**Example · CD audio**

- f_s = 44 100 samples per second
- T_s = 1 / 44 100 = 22.7 microseconds between readings
- 3 min of stereo = 44 100 × 180 × 2 = 15.9 million numbers

**Equations**

- `x[n] = x(n · T_s)        f_s = 1 / T_s`  
  Sample number n is the voltage at time n × T_s; f_s is samples per second

**Speaker notes**

The chart shows the smooth wave (line) and the readings (stems). The digital side only ever receives the stems. Ask: could you redraw the wave from the stems alone? Yes, and Part 2 explains when.

> **For the experts (notes and appendix only).** Mathematically sampling multiplies x(t) by an impulse train; in frequency this convolves X(f) with impulses at multiples of f_s, creating periodic copies. Aliasing is those copies overlapping.

### Slide 15 · How often is often enough? Twice the highest frequency · 4 min

**Slide content**

- Chart: a 9 kHz wave read 8 000 times a second gives exactly the same readings as a 1 kHz wave
- Once that happens nothing can undo it: the readings are identical, so the computer cannot tell them apart

**Think of it like this.** Wagon wheels in old films spin backwards: the camera at 24 pictures a second is too slow for the spokes. A clock glanced at once every 11 hours also looks like it runs backwards.

**Example · What happens to 60 MHz at 100 MSPS**

- Rule: 100 MSPS can only represent up to 50 MHz
- 60 MHz is 10 MHz above the limit
- It appears at |60 − 100| = 40 MHz, a fake signal

**Equations**

- `f_s > 2 · f_max`  
  Nyquist rule: sample more than twice as fast as the fastest wiggle
- `f_alias = | f − k · f_s | k = nearest whole number`  
  Break the rule and a fast wave shows up disguised as a slow one

**Speaker notes**

This is the key slide of Part 2. Walk through the chart: the coral 9 kHz wave and the teal 1 kHz wave pass through identical black stems. Same numbers in, so the same signal as far as the computer knows. Ask the room the 60 MHz example before revealing the answer.

> **For the experts (notes and appendix only).** Aliasing folds the spectrum about f_s/2 like a sheet of paper. Bandpass (under)sampling exploits this deliberately: 2 f_H / n ≤ f_s ≤ 2 f_L / (n − 1) keeps a band [f_L, f_H] clear of the fold points.

### Slide 16 · The bouncer at the door: the anti-alias filter · 2 min

**Slide content**

- Rule: remove everything above half the sample rate before sampling, while the signal is still analog
- Real filters do not cut sharply, so in practice we sample 2.2 to 2.5 times the signal bandwidth, not exactly 2
- Sampling much faster than needed (oversampling) lets a cheap analog filter and a good digital filter share the job

**Think of it like this.** A nightclub bouncer stands at the door and turns away anyone who will cause trouble inside. Once a too-fast signal gets past the ADC it is disguised as a slow one and cannot be found and removed.

**Example · Audio ADC**

- Hearing stops at 20 kHz; the filter must be shut by 22 kHz
- CD chose 44.1 kSPS = 2.2 × 20 kHz, room for the filter to roll off
- Chart: a real 5th-order filter versus the ideal brick wall

**Speaker notes**

The chart shows why we cannot sample at exactly 2 × the bandwidth: the real filter (teal) needs room to fall from 0 dB to −80 dB.

> **For the experts (notes and appendix only).** Undersampling an IF (for example a 70 MHz IF at 61.44 MSPS) deliberately aliases the band down to baseband. It works only with a good bandpass filter and a low-jitter clock, because jitter noise scales with the analog input frequency, not with f_s.

### Slide 17 · Going back: redrawing the wave from the numbers · 2 min

**Slide content**

- If the Nyquist rule was obeyed, there is exactly one smooth wave that fits the samples
- In hardware a DAC outputs a staircase (amber) and a low-pass filter smooths it into the curve (teal)

**Think of it like this.** Join-the-dots, but with a rule: the pen may only draw gentle curves, never sharp corners. With that rule there is only one picture that fits, and it is the original.

**Example · Streaming music**

- Phone receives 48 000 numbers per second
- The DAC makes a 48 kHz staircase, the filter smooths it
- The staircase dips 3.9 dB at 24 kHz; the chip pre-boosts it back

**Equations**

- `x(t) = Σₙ x[n] · sinc( (t − n T_s) / T_s )`  
  Each sample launches a little ripple; add the ripples and the smooth wave is back

**Speaker notes**

Beginners: a low-pass filter is a very good guesser. Given the dots, it draws the only smooth curve that could have produced them.

> **For the experts (notes and appendix only).** The sinc kernel is the impulse response of the ideal low-pass filter; the interpolation sum is the convolution of the sample train with that kernel. Zero-order hold contributes sinc(f/f_s) droop, usually pre-compensated digitally.

### Slide 18 · Recap · Part 2 · 1 min

**Slide content**

- Sampling = reading the voltage f_s times per second; the computer only sees the readings
- Read more than twice as fast as the fastest wiggle, or fast waves come back disguised as slow ones
- Filter first, then sample: a disguised signal cannot be removed later
- Obey the rule and the smooth wave can be redrawn exactly from the numbers

**Speaker notes**

Quick check: sampling at 100 MSPS, what is the highest frequency we can trust? 50 MHz. And a 60 MHz tone shows up at? 40 MHz.

## Part 3 · Inside the ADC (20 min)

### Slide 19 · Part 3 · Inside the ADC

*What happens in each clock tick between a voltage and a binary number*

**Speaker notes**

You are here: the ADC. Beginners need only three ideas: hold the voltage still, compare it with a ruler, write down the mark number.

### Slide 20 · An ADC in one picture: hold, compare, write down · 2 min

**Slide content**

- 1 · Sample-and-hold freezes the input voltage so it cannot change during the measurement
- 2 · Quantiser compares the frozen voltage with a ruler that has 2ᴺ marks and picks the nearest mark
- 3 · Encoder writes the mark number as an N-bit binary number
- A clock repeats all three steps f_s times per second

**Think of it like this.** Measuring a child's height: ask them to stand still (hold), line them up against a ruler with centimetre marks (compare), write the number in the book (encode). Do it again every birthday (clock).

**Example · A 12-bit ADC at 40 MSPS**

- Ruler with 2¹² = 4096 marks
- One measurement every 1/40e6 = 25 nanoseconds
- Output: 40 million 12-bit numbers per second = 480 Mbit/s

**Speaker notes**

Every ADC design in the next slides is a different way of doing step 2 faster, more accurately, or more cheaply.

### Slide 21 · Step 1 · Sample-and-hold: freeze the voltage · 2 min

**Think of it like this.** Asking a wriggling child to stand still for a moment so you can read the height mark. The switch is the "stand still" command; the capacitor is the child holding the pose while you read.

**Example · 12-bit ADC at 40 MSPS**

- One reading every 25 ns: about half track, half hold
- During track the capacitor must settle to within 1/4096
- Needs a time constant of about 12 ns / ln(4096) ≈ 1.5 ns

**Speaker notes**

Diagram, left: a switch and a capacitor. Switch closed = capacitor follows the input (track). Switch open = capacitor keeps the value (hold) while the rest of the ADC measures it. Diagram, right: the clock and the capacitor voltage over two cycles. The dashed lines mark the timing wobble of the switch opening, which the next slide is about.

### Slide 22 · Timing wobble: the hidden limit at high frequencies · 2 min

**Slide content**

- The switch never opens at exactly the same moment each time; the wobble is called jitter, t_j
- A fast-changing input moves a lot during that wobble, so the frozen value is slightly wrong
- Chart: three wobble sizes; every 10 × more wobble, or 10 × higher input frequency, costs 20 dB

**Think of it like this.** Photographing a sprinter. If the shutter fires a little late you capture a different position. The faster the runner (higher input frequency), the bigger the error from the same timing slip.

**Example · 100 MHz input, 1 ps wobble**

- SNR limit = −20 log₁₀(2π × 1e8 × 1e−12) = 64 dB
- That is only about 10 good bits, whatever the chip claims
- To keep 12 bits at 100 MHz you need about 100 fs of wobble

**Equations**

- `SNR_jitter = −20 · log₁₀( 2π · f_in · t_j )`  
  If the freeze moment wobbles by t_j seconds, this is the best accuracy you can get

**Speaker notes**

Chart: three lines for 100 fs, 1 ps, 10 ps; each falls 20 dB per decade of input frequency. This is why ADC datasheets quote performance at a specific input frequency.

> **For the experts (notes and appendix only).** Slope error ΔV = (dV/dt) · t_j; for a full-scale sine dV/dt peaks at 2π f A, hence the formula. Clock phase noise integrated over the relevant band gives t_j. At a 1 GHz input, 12-bit performance needs about 100 fs rms jitter.

### Slide 23 · Quantisation: a ruler with 2ᴺ marks · 3 min

**Slide content**

- Chart: a 3-bit ruler (8 marks) turning a smooth ramp into a staircase
- One extra bit doubles the number of marks and halves the step

**Think of it like this.** A ruler marked only in whole centimetres: a 173.6 cm person is written down as 174. The rounding is the quantisation error. Add millimetre marks (more bits) and the error shrinks ten-fold.

**Example · 3 bits versus 12 bits, 2 V range**

- 3 bits: 8 marks, step = 2 / 8 = 0.25 V
- 12 bits: 4096 marks, step = 2 / 4096 = 0.49 mV
- Input 0.26 V → 3-bit reads 0.25 V, 12-bit reads 0.2598 V

**Equations**

- `LSB = V_FS / 2ᴺ`  
  Size of one step (LSB = least significant bit) for an N-bit ruler over V_FS volts
- `code = round( V_in / LSB )`  
  The mark number: how many steps fit into the input

**Speaker notes**

The staircase is drawn as a dense line chart so it stays a native, editable PowerPoint chart. Point at the gap between ramp and staircase: that is the error the next slide is about.

### Slide 24 · The rounding error looks like noise · 2 min

**Slide content**

- Left chart: error against input is a sawtooth; right chart: how often each error size occurs is flat
- For a busy signal the errors look random, so we treat rounding as a small extra hiss

**Think of it like this.** Rounding every shop price to the nearest 10p: sometimes you gain, sometimes you lose, never more than 5p, and over a month it averages out like small random noise.

**Example · 12-bit, 2 V range**

- Step = 0.49 mV, so error is within ±0.24 mV
- Error power = (0.49 mV)² / 12 → rms error = 0.14 mV
- Compared with a 1 V signal that is 1 part in 7000

**Equations**

- `e = V_in − V_q −LSB/2 ≤ e < +LSB/2`  
  The error is never more than half a step either way
- `σ²_e = LSB² / 12`  
  Its average power, if every error size is equally likely

**Speaker notes**

The variance formula is the integral of e² over the flat density 1/LSB from −LSB/2 to +LSB/2. Beginners only need: error is at most half a step, and it behaves like hiss.

> **For the experts (notes and appendix only).** The uniform, white assumption fails for small or periodic inputs, where the error becomes a deterministic harmonic pattern (spurs). Dither (adding a little noise before the quantiser) randomises the error and restores the model.

### Slide 25 · The famous rule: 6 dB per bit · 3 min

**Think of it like this.** Each extra bit doubles the number of ruler marks, so the rounding error halves. Halving a voltage error is 6 dB. Ten bits buy 60 dB, twenty bits buy 120 dB.

**Example · Reading a datasheet**

- Ideal 12-bit: 6.02 × 12 + 1.76 = 74 dB
- A real "14-bit" ADC measures 72 dB at 70 MHz input
- ENOB = (72 − 1.76) / 6.02 = 11.7: really an 11.7-bit ADC there

**Equations**

- `P_signal = (V_FS / 2)² / 2 P_noise = LSB² / 12`  
  Biggest clean sine wave versus the rounding hiss
- `SNR = 6.02 · N + 1.76 dB`  
  Divide them and take the log: every bit adds about 6 dB
- `ENOB = ( SINAD − 1.76 ) / 6.02`  
  Run the rule backwards on a measurement to get the real, effective number of bits

**Speaker notes**

Derive it live for the experts: signal amplitude V_FS/2, power amplitude²/2; noise LSB²/12 with LSB = V_FS/2^N; divide, take 10 log. Beginner take-away: 6 dB per bit, and always check ENOB at your input frequency, not the number on the box.

### Slide 26 · Flash ADC: ask every question at once · 2 min

**Slide content**

- A chain of resistors makes 2ᴺ − 1 reference voltages, one per ruler mark
- One comparator per mark asks "is the input above me?" all at the same time
- The answers come out as a run of 1s then 0s (like a thermometer); a small logic block turns that into binary
- Fastest design there is: one clock tick per measurement, billions per second
- But 8 bits need 255 comparators and 12 bits need 4095: power and chip area explode

**Think of it like this.** To find someone's height, line up 255 people each holding a ruler mark and shout "hands up if the person is taller than your mark". One second, one answer, but you need 255 helpers.

**Example · 3-bit flash in the diagram**

- Input at 0.55 of full scale; 7 comparators
- The bottom four say 1, the top three say 0: 0001111
- Encoder converts that to 4 in binary = 100

**Speaker notes**

Diagram: resistor ladder on the left, comparators (triangles) in the middle, teal ones are saying "yes", encoder on the right.

> **For the experts (notes and appendix only).** Comparator offset must be below LSB/2, which is why practical flash converters stop at 6 to 8 bits. Interpolating and folding architectures reduce the comparator count; time-interleaving many slower ADCs is the other route to GSPS.

### Slide 27 · SAR ADC: the guessing game, one bit per tick · 3 min

**Slide content**

- One comparator, one internal DAC, and N clock ticks per measurement
- Tick 1: try half of full scale. Input above it? Keep that bit. Below? Drop it
- Tick 2: add a quarter and try again. Repeat with an eighth, a sixteenth… until the last bit
- Chart: an 8-bit SAR homing in on 0.70 of full scale in 8 ticks → code 179 = 10110011

**Think of it like this.** Guess my number between 0 and 255 and I will only say "higher" or "lower". Always start at 128, then 64 up or down, and so on. Eight questions are always enough.

**Example · Follow the chart**

- Try 0.500: below 0.70, keep (1). Try 0.750: above, drop (0)
- 0.625 keep (1), 0.6875 keep (1), 0.719 drop (0), 0.703 drop (0)…
- After 8 ticks: 0.6992, within one step (1/256) of 0.70

**Speaker notes**

Chart walk-through: amber dots are the trial voltages; the teal line is the result after each decision; the coral line is the input. Where amber overshoots, the bit is dropped and teal stays put.

> **For the experts (notes and appendix only).** Modern SAR ADCs use a binary-weighted capacitor DAC with charge redistribution; the sampling capacitor is the DAC, so there is no separate sample-and-hold. Asynchronous SAR and time-interleaving push SAR past 1 GSPS at 10 to 12 bits. Pipeline ADCs chain several coarse stages, each passing its residue on, trading latency for speed and resolution.

### Slide 28 · Sigma-delta ADC: many rough guesses, averaged · 2 min

**Slide content**

- A crude 1-bit quantiser runs at millions of samples per second; a digital filter averages the stream down
- Result: 16 to 24 clean bits, at the cost of speed; used in audio, meters, and many phone receivers

**Think of it like this.** Weighing a letter on a bathroom scale that only says "over 50 g" or "under 50 g". Ask a thousand times while nudging the letter, count the "overs", and you get the weight to a fraction of a gram.

**Example · Audio at 24 bits**

- Band 20 kHz, modulator 6.1 MSPS → OSR = 6.1e6 / 40e3 ≈ 153
- OSR doubled 7 times, 2nd-order shaping: 7 × 15 = 105 dB gained
- A 1-bit front end ends up with about 20 real bits

**Equations**

- `OSR = f_s / (2 B)`  
  Oversampling ratio: how many times faster than necessary we sample
- `plain averaging: +3 dB per doubling of OSR 1st-order noise shaping: +9 dB per doubling`  
  Sampling faster spreads the hiss out; the loop also pushes it to frequencies we throw away

**Speaker notes**

Beginners: instead of one careful measurement, make thousands of crude yes/no measurements very fast and average. Noise shaping is the trick of making the crude errors land at frequencies you were going to discard anyway.

> **For the experts (notes and appendix only).** The noise transfer function of a first-order loop is (1 − z⁻¹); in-band noise falls 9 dB per octave of OSR, (6L + 3) dB for an L-th order loop. Chart: flat quantisation noise versus first- and second-order shaped noise.

### Slide 29 · Reading an ADC datasheet · 2 min

| Term | Plain meaning | Why you care |
|---|---|---|
| SNR | Signal above the hiss (ignoring distortion) | Weak signals |
| SFDR | Signal above the biggest false tone | A weak signal next to a strong one |
| SINAD / ENOB | Signal above hiss plus distortion; the real bit count | The honest resolution at your frequency |
| DNL / INL | How uneven or bent the ruler marks are | Missing codes, distortion |

| Type | Speed | Bits | Delay | Typical use |
|---|---|---|---|---|
| Flash | billions/s | 4–8 | 1 tick | Oscilloscopes, high-speed links |
| SAR | thousands to 100s of millions/s | 8–18 | N ticks | Sensors, radios, control |
| Pipeline | 10s of millions to billions/s | 10–16 | a few ticks | Radio receivers, video |
| Sigma-delta | thousands to 10s of millions/s | 16–24 | long | Audio, precision meters |

**Example · Which ADC for a 20 MHz Wi-Fi channel?**

- Need about 50 MSPS and 10 to 12 real bits at 10 MHz input
- SAR or pipeline fit; flash too coarse, sigma-delta too slow
- Check ENOB at 10 MHz in the datasheet, not headline bits

**Speaker notes**

Give beginners the three numbers to look up first: sample rate, ENOB at their input frequency, SFDR. Experts: the table is a starting point; architectures blend (pipelined SAR, continuous-time sigma-delta at hundreds of MHz).

### Slide 30 · Recap · Part 3 · 1 min

**Slide content**

- Hold, compare, write down; a clock repeats it f_s times a second
- Step size = range / 2ᴺ; the rounding error is at most half a step and behaves like hiss
- Every bit buys 6 dB; ENOB tells you the real bit count
- Timing wobble limits accuracy at high input frequencies
- Flash: all at once. SAR: guessing game, one bit per tick. Sigma-delta: many rough guesses averaged

**Speaker notes**

Check with the room: a 10-bit ADC gives roughly what SNR? About 62 dB. Which ADC type for a microphone? Sigma-delta.

## Part 4 · FFT and IFFT (25 min)

### Slide 31 · Part 4 · FFT and IFFT

*Finding the frequencies hidden in a list of numbers, and going back*

**Speaker notes**

You are here: the DSP block. Beginners: the DFT asks "how much of each frequency is in here?" The FFT is just a faster way to get the same answer. The IFFT goes back.

### Slide 32 · Why look at frequencies at all? · 3 min

**Slide content**

- Left: 256 readings of two tones plus hiss; in time it is a mess
- Right: the same readings after an FFT; two clean peaks, hiss far below
- Picking a channel, filtering, and measuring a spectrum are all easy once you see frequencies

**Think of it like this.** A piano chord is one messy pressure wave in the air, but three clear notes on the sheet music. The FFT is the trained ear that hears the notes inside the mess.

**Example · Read the right-hand chart**

- Peaks at 30 kHz (0 dB) and 75 kHz (−10 dB): the two tones
- Hiss sits near −50 dB: the FFT pushed it down about 21 dB
- A tone fills one bucket; the hiss is spread over 128 buckets

**Speaker notes**

Show the left chart first and ask "how many tones?" Nobody can tell. Then reveal the right chart.

> **For the experts (notes and appendix only).** The FFT concentrates a tone into one bin while spreading white noise over N bins: processing gain 10 log₁₀(N/2), about 21 dB for N = 256.

### Slide 33 · One idea, three versions · 2 min

**Think of it like this.** Same recipe each time: multiply the signal by a test wave of one frequency and add everything up. A big total means that frequency is present. The DFT just does it with a list of numbers instead of a smooth curve.

**Example · Which one does your phone run?**

- Always the DFT: the ADC handed it a list of numbers
- Wi-Fi: 64 numbers in, 64 frequencies out
- 5G: up to 4096 numbers in, 4096 frequencies out

**Equations**

- `Fourier series:   c_k = (1/T) ∫₀ᵀ x(t) e^{−j2πkt/T} dt`  
  For a repeating wave: a list of harmonics
- `Fourier transform:   X(f) = ∫ x(t) e^{−j2πft} dt`  
  For any smooth wave: a continuous spectrum
- `DFT:   X[k] = Σₙ₌₀ᴺ⁻¹ x[n] e^{−j2πkn/N}`  
  For a list of N numbers: the version a computer can run

**Speaker notes**

Do not derive anything here. The point is only that the three formulas are the same operation for three kinds of input.

> **For the experts (notes and appendix only).** The DFT implicitly assumes x[n] is periodic with period N; that assumption is where spectral leakage comes from.

### Slide 34 · The DFT: what k, n and N mean · 3 min

**Slide content**

- x[n] is reading number n; X[k] says how much of frequency f_k is present (size and timing)
- For real readings, the top half of the bins mirrors the bottom half, so only N/2 are new information

**Think of it like this.** N readings go in and N "buckets" come out, one per frequency. Bucket k collects everything that wiggles k times during the recording. A longer recording (bigger N at the same f_s) gives narrower buckets.

**Example · 40 MSPS, 1024 readings**

- Δf = 40 000 000 / 1024 = 39 062.5 Hz per bucket
- A 10 MHz tone lands in bucket 10 000 000 / 39 062.5 = 256
- Want 1 kHz detail? Take 40 000 readings (1 ms of signal)

**Equations**

- `X[k] = Σₙ₌₀ᴺ⁻¹ x[n] · e^{−j2πkn/N} k = 0 … N−1`  
  N readings in, N frequency amounts out
- `f_k = k · f_s / N        Δf = f_s / N`  
  Bin k means frequency k × (f_s / N); Δf is how fine the frequency detail is

**Speaker notes**

Do the example arithmetic slowly. The numbers 39.06 kHz and bin 256 return in Part 5.

> **For the experts (notes and appendix only).** Resolution Δf depends on record length N·T_s = N/f_s only. Zero-padding interpolates the plot but does not improve resolution; only a longer record does.

### Slide 35 · What the DFT actually does: compare with test waves · 3 min

**Slide content**

- Chart: the test cosines for k = 1, 2, 3 with 32 readings; k counts whole wiggles across the recording
- Multiply the readings by a test wave point by point and add up: a big total means a match

**Think of it like this.** To check whether a song contains a particular note, hum that note along with it and feel whether it resonates. The DFT hums N different notes in turn and writes down how strongly each one resonates.

**Example · Tiny DFT by hand, N = 4**

- Readings: 1, 0, −1, 0 (one full wiggle)
- Bucket 1 test wave 1, 0, −1, 0: products add to 2, a match
- Bucket 0 (no wiggle): 1 + 0 − 1 + 0 = 0: nothing at DC

**Equations**

- `e^{−j2πkn/N} = cos(2πkn/N) − j sin(2πkn/N)`  
  Each bucket compares the readings with one cosine and one sine
- `W_N = e^{−j2π/N}`  
  The "twiddle factor": one step around a circle of N steps

**Speaker notes**

Chart: k = 1 fits one wiggle in the recording, k = 2 fits two, k = 3 fits three. Do the N = 4 example on a whiteboard if there is one.

> **For the experts (notes and appendix only).** Orthogonality: Σₙ W_N^{(k−m)n} = N·δ[k−m]. This geometric-series identity is the reason each bin measures its own frequency without interference and why the inverse needs only a 1/N scale factor.

### Slide 36 · The FFT: same answer, far less work · 4 min

**Slide content**

- Splitting halves the work; splitting again and again gives log₂N rounds
- The "butterfly" on the right is the whole algorithm: two numbers in, one multiply, two numbers out

**Think of it like this.** Sorting a deck of cards by splitting it in half, sorting each half, then merging. The FFT does the same with frequencies. Nothing is approximated: the answer is exactly the DFT, only reached faster.

**Example · N = 1024 readings**

- Plain DFT: 1024 × 1024 = 1 048 576 multiplies
- FFT: (1024 / 2) × 10 = 5 120 butterflies
- About 200 × less work; at 4096 points nearly 700 ×

**Equations**

- `X[k] = E[k] + W_N^k · O[k] X[k + N/2] = E[k] − W_N^k · O[k]`  
  Split the readings into even and odd ones, solve each half, then stitch
- `DFT: N² multiplies FFT: (N/2) · log₂N butterflies`  
  Cooley and Tukey, 1965; Gauss had it in 1805

**Speaker notes**

Butterfly: a plus W times b goes to the top output, a minus W times b goes to the bottom. That symmetry is the entire saving.

> **For the experts (notes and appendix only).** Radix-4 and split-radix reduce multiplies further; real-input FFTs halve the work again by packing two real signals into one complex FFT. Fixed-point implementations need scaling at each stage (bit growth of 1 bit per stage).

### Slide 37 · An 8-point FFT, step by step · 3 min

**Slide content**

- Inputs enter in a shuffled order (bit-reversed): x[0], x[4], x[2], x[6], x[1], x[5], x[3], x[7]
- Three rounds of butterflies (teal, amber, coral), four butterflies per round
- Outputs X[0] … X[7] come out in normal order

**Think of it like this.** A knockout tournament in reverse: pairs are combined in round 1, pairs of pairs in round 2, and everything in round 3. Three rounds are enough for 8 players because 2³ = 8.

**Example · Count the work**

- 3 rounds × 4 butterflies = 12 butterflies
- The plain DFT would need 8 × 8 = 64 multiplies
- The shuffle: index 1 = 001, reversed = 100 = 4, so x[4] is 2nd

**Speaker notes**

Walk the diagram left to right. Emphasise the shuffle: it is not random, it is the binary index written backwards.

> **For the experts (notes and appendix only).** Decimation-in-frequency does the mirror image (natural-order in, bit-reversed out). Hardware FFTs often pipeline one stage per clock.

### Slide 38 · Windowing: fixing the seam · 3 min

**Slide content**

- The FFT quietly assumes the recording repeats forever; a tone that does not finish a whole wiggle has a jump where the copies meet
- That jump spreads energy over every bin (coral): spectral leakage
- Fading the recording in and out (teal, Hann window) removes the jump; the skirts drop by about 20 dB

**Think of it like this.** Cutting a strip from a roll of patterned wallpaper and gluing the ends together. If the pattern does not line up you get an ugly seam. A window fades the pattern out at the ends so no seam shows.

**Example · Chart settings**

- 128 readings, tone at 20.5: between two buckets, worst case
- No window: skirts at −30 dB would hide a weak neighbour
- Hann: skirts below −80 dB nearby; peak 2 buckets wide, not 1

**Equations**

- `Hann:   w[n] = 0.5 · ( 1 − cos(2πn/N) )`  
  Multiply the readings by this gentle hump before the FFT

**Speaker notes**

Compare the two skirts on the chart. The price of the window is a slightly wider peak; the reward is being able to see weak signals next to strong ones.

> **For the experts (notes and appendix only).** Choose the window for the job: Hann for general use, flat-top for amplitude accuracy, Blackman–Harris for dynamic range (−92 dB sidelobes), Kaiser for a tunable trade-off. Correct coherent gain and equivalent noise bandwidth when reading absolute levels.

### Slide 39 · IFFT: from frequencies back to readings · 3 min

**Slide content**

- Chart: 64 readings and the IFFT of their FFT lie exactly on top of each other
- Change some buckets in between (for example set a few to zero) and you have built a filter

**Think of it like this.** If the FFT is the recipe that lists how much of each ingredient is in a cake, the IFFT bakes the cake again from the recipe. Nothing is lost in either direction.

**Example · Remove a hum with FFT + IFFT**

- Recording has a 50 Hz mains hum on top of speech
- FFT, set the 50 Hz bucket to zero, IFFT
- Speech comes back hum-free; round-trip error near 10⁻¹⁶

**Equations**

- `x[n] = (1/N) · Σₖ₌₀ᴺ⁻¹ X[k] · e^{+j2πkn/N}`  
  Same shape as the DFT: plus sign in the exponent, divide by N
- `IFFT(X) = conj( FFT( conj(X) ) ) / N`  
  So one FFT engine can run in both directions

**Speaker notes**

The stat on the slide is the measured round-trip error from our own build script.

> **For the experts (notes and appendix only).** Fast convolution: y = IFFT(FFT(x) · FFT(h)) is circular convolution; overlap-add or overlap-save with zero padding makes it linear. It beats direct convolution for filter lengths above roughly 64 taps.

### Slide 40 · Recap · Part 4 · 1 min

**Slide content**

- The DFT sorts N readings into N frequency buckets; bucket k is at k × f_s / N
- Each bucket is a comparison with one test cosine and one test sine
- The FFT is the same answer with (N/2) log₂N butterflies instead of N² multiplies
- Fade the recording in and out (window) before the FFT, or the seam smears the spectrum
- The IFFT goes back exactly; FFT then IFFT loses nothing

**Speaker notes**

Check: 2048-point FFT at 100 MSPS, how wide is a bucket? 48.8 kHz. Which bucket holds 25 MHz? 512.

## Part 5 · Putting it together (12 min)

### Slide 41 · Part 5 · Putting it together

*One complete example, where Wi-Fi and 5G use the FFT, and the classic mistakes*

**Speaker notes**

You are here: the whole chain. The worked example uses only equations already shown.

### Slide 42 · One complete example: 2.4 GHz tone to an FFT bucket · 4 min

**Worked steps**

1. **Radio input** · A 2.400 GHz tone reaches the ADC at −60 dBm after LNA and mixer
2. **Mix down** · Local oscillator 2.390 GHz → tone now at 10 MHz; filter passes 5–15 MHz
3. **Sample** · 40 MSPS (more than 2 × 15 MHz), 12 bits → ideal SNR 74 dB
4. **FFT** · Bucket width 40e6 / 1024 = 39.06 kHz; tone in bucket 10e6 / 39 062.5 = 256
5. **Noise floor** · Hiss spread over 512 buckets: −74 − 10 log₁₀(512) = −101 dBFS
6. **Result** · One peak in bucket 256, standing 101 dB above the floor

**Think of it like this.** Follow one grain of sand through the whole machine: caught, slowed, filtered, weighed, sorted into a bucket. Every number on this slide comes from a rule already shown.

**Equations**

- `FFT floor (dBFS) = −(6.02 N_bits + 1.76) − 10 log₁₀(N/2)`  
  ADC hiss spread over N/2 buckets

**Speaker notes**

Go through each row slowly; this is the slide beginners should be able to reproduce afterwards. Expert aside: with 1 ps jitter at 10 MHz the jitter limit is 84 dB, above the 74 dB quantisation limit, so the 12 bits are usable. At a 200 MHz IF jitter (58 dB) would dominate.

### Slide 43 · Where the FFT lives: Wi-Fi, LTE and 5G · 3 min

**Slide content**

- Transmitter: put one small symbol on each of many frequency buckets, run an IFFT, send the result
- Receiver: run an FFT and the symbols fall straight back out of the buckets (right chart)

**Think of it like this.** Instead of one lorry racing down one lane, OFDM sends many slow bicycles side by side in many narrow lanes. The IFFT packs the bicycles into one road; the FFT unpacks them at the other end.

**Example · Wi-Fi 802.11a/g in numbers**

- 64-point IFFT: 52 buckets carry data, 12 empty guard buckets
- Bucket spacing 20 MHz / 64 = 312.5 kHz
- A symbol every 4 µs: 52 × 6 bits × 250 000/s = 54 Mbit/s

**Speaker notes**

Left chart: the noise-like OFDM waveform that the IFFT produces. Right chart: what the receiver's FFT gets back: 52 filled buckets, 12 empty guard buckets, exactly as sent.

> **For the experts (notes and appendix only).** The cyclic prefix turns the channel's linear convolution into a circular one, so a multipath channel becomes a single complex gain per subcarrier: one-tap equalisation. That is the entire reason OFDM won. 5G NR uses up to 4096-point FFTs. Spectrum analysers and radar range-Doppler maps are the other big FFT users.

### Slide 44 · Five classic mistakes (all seen in real projects) · 3 min

1. **No anti-alias filter** · A 60 MHz interferer sampled at 100 MSPS appeared as a mystery signal at 40 MHz. Weeks lost. It cannot be removed after sampling.
2. **Driving the ADC too hard** · Input above full scale clips the top of the wave and sprays false tones everywhere. Leave 6 to 10 dB of headroom.
3. **Forgetting the window** · A strong carrier's leakage skirts buried the weak signal 3 buckets away. A Hann window would have shown it.
4. **Bucket arithmetic** · Reading bucket 256 as 12.5 MHz because someone used f_s / 2N. Always write Δf = f_s / N first.
5. **Ignoring timing wobble** · A "14-bit" ADC delivered 9 bits at a 500 MHz input because the clock was noisy. Check the jitter spec.

**Speaker notes**

Each card is a real story. Invite the experts in the room to add their own.

### Slide 45 · Summary · the slide to photograph · 2 min

|   |   |
|---|---|
| Signal | x(t) = A cos(2πft + φ) = I cos ωt − Q sin ωt |
| Power | P(dBm) = 10 log₁₀(P / 1 mW);  noise floor = −174 dBm/Hz + 10 log₁₀(B) |
| Sampling | x[n] = x(nT_s);  f_s > 2 f_max;  disguised frequency = |f − k f_s| |
| Quantiser | step = V_FS / 2ᴺ;  error power = step² / 12 |
| ADC accuracy | SNR = 6.02 N + 1.76 dB;  ENOB = (SINAD − 1.76) / 6.02 |
| Timing wobble | SNR limit = −20 log₁₀(2π f_in t_j) |
| DFT | X[k] = Σ x[n] e^{−j2πkn/N};  bucket k at k f_s / N;  width f_s / N |
| FFT | X[k] = E[k] + W^k O[k];  (N/2) log₂N butterflies instead of N² |
| IFFT | x[n] = (1/N) Σ X[k] e^{+j2πkn/N} |
| FFT noise floor | −(6.02 N + 1.76) − 10 log₁₀(N/2) dBFS |

**Speaker notes**

Leave this slide up during questions.

## Appendix · for the RF engineers

### Slide 46 · Appendix A · RF fundamentals and sampling

**Expert notes collected from the talk**

- **An RF signal is a very fast wave.** Real signals are bandpass: a carrier at fc with information spread over a bandwidth B ≪ fc. That separation of scales is what makes downconversion and complex baseband possible.
- **Decibels: counting zeros instead of writing them.** Voltage ratios use 20 log₁₀ because power goes as V². That form assumes equal source and load impedance; mixing 10 log (power) and 20 log (voltage) is the most common dB mistake in link budgets.
- **Putting information on the wave.** The I/Q form is the trigonometric expansion of A·cos(ωt + φ) with I = A cos φ and Q = A sin φ. Every modern transceiver implements exactly this equation in hardware: two DACs, two mixers, one 90° phase shifter.
- **Why we do not have to measure the fast wave.** Negative frequencies are real in complex baseband: an offset of −1 MHz from fc is a distinct signal from +1 MHz. Image rejection depends on I/Q gain and phase balance: IRR ≈ −10 log₁₀((ε² + Δφ²)/4).
- **Noise: the hiss under every signal.** Friis uses linear ratios, not dB. A 3 dB NF LNA with 20 dB gain in front of a 10 dB NF mixer gives F = 2 + (10 − 1)/100 = 2.09 → 3.2 dB. Swap the order and NF jumps to nearly 10 dB.
- **Link budget: will the signal arrive?.** FSPL grows 6 dB per doubling of distance and 6 dB per doubling of frequency, which is why mmWave 5G needs beamforming gain to close the same link.

**Speaker notes**

Not presented. Reference material for the RF engineers: the expert corners from Part 1.

### Slide 47 · Appendix B · Sampling and ADC internals

**Expert notes collected from the talk**

- **Sampling: take a reading every T_s seconds.** Mathematically sampling multiplies x(t) by an impulse train; in frequency this convolves X(f) with impulses at multiples of f_s, creating periodic copies. Aliasing is those copies overlapping.
- **How often is often enough? Twice the highest frequency.** Aliasing folds the spectrum about f_s/2 like a sheet of paper. Bandpass (under)sampling exploits this deliberately: 2 f_H / n ≤ f_s ≤ 2 f_L / (n − 1) keeps a band [f_L, f_H] clear of the fold points.
- **The bouncer at the door: the anti-alias filter.** Undersampling an IF (for example a 70 MHz IF at 61.44 MSPS) deliberately aliases the band down to baseband. It works only with a good bandpass filter and a low-jitter clock, because jitter noise scales with the analog input frequency, not with f_s.
- **Going back: redrawing the wave from the numbers.** The sinc kernel is the impulse response of the ideal low-pass filter; the interpolation sum is the convolution of the sample train with that kernel. Zero-order hold contributes sinc(f/f_s) droop, usually pre-compensated digitally.
- **Timing wobble: the hidden limit at high frequencies.** Slope error ΔV = (dV/dt) · t_j; for a full-scale sine dV/dt peaks at 2π f A, hence the formula. Clock phase noise integrated over the relevant band gives t_j. At a 1 GHz input, 12-bit performance needs about 100 fs rms jitter.
- **The rounding error looks like noise.** The uniform, white assumption fails for small or periodic inputs, where the error becomes a deterministic harmonic pattern (spurs). Dither (adding a little noise before the quantiser) randomises the error and restores the model.

**Speaker notes**

Not presented. Reference material: the expert corners from Parts 2 and 3.

### Slide 48 · Appendix C · ADC architectures

**Expert notes collected from the talk**

- **Flash ADC: ask every question at once.** Comparator offset must be below LSB/2, which is why practical flash converters stop at 6 to 8 bits. Interpolating and folding architectures reduce the comparator count; time-interleaving many slower ADCs is the other route to GSPS.
- **SAR ADC: the guessing game, one bit per tick.** Modern SAR ADCs use a binary-weighted capacitor DAC with charge redistribution; the sampling capacitor is the DAC, so there is no separate sample-and-hold. Asynchronous SAR and time-interleaving push SAR past 1 GSPS at 10 to 12 bits. Pipeline ADCs chain several coarse stages, each passing its residue on, trading latency for speed and resolution.
- **Sigma-delta ADC: many rough guesses, averaged.** The noise transfer function of a first-order loop is (1 − z⁻¹); in-band noise falls 9 dB per octave of OSR, (6L + 3) dB for an L-th order loop. Chart: flat quantisation noise versus first- and second-order shaped noise.

**Speaker notes**

Not presented. Reference material: ADC architecture detail.

### Slide 49 · Appendix D · DFT and FFT

**Expert notes collected from the talk**

- **Why look at frequencies at all?.** The FFT concentrates a tone into one bin while spreading white noise over N bins: processing gain 10 log₁₀(N/2), about 21 dB for N = 256.
- **One idea, three versions.** The DFT implicitly assumes x[n] is periodic with period N; that assumption is where spectral leakage comes from.
- **The DFT: what k, n and N mean.** Resolution Δf depends on record length N·T_s = N/f_s only. Zero-padding interpolates the plot but does not improve resolution; only a longer record does.
- **What the DFT actually does: compare with test waves.** Orthogonality: Σₙ W_N^{(k−m)n} = N·δ[k−m]. This geometric-series identity is the reason each bin measures its own frequency without interference and why the inverse needs only a 1/N scale factor.
- **The FFT: same answer, far less work.** Radix-4 and split-radix reduce multiplies further; real-input FFTs halve the work again by packing two real signals into one complex FFT. Fixed-point implementations need scaling at each stage (bit growth of 1 bit per stage).

**Speaker notes**

Not presented. Reference material: the expert corners from Part 4.

### Slide 50 · Appendix E · FFT in practice and OFDM

**Expert notes collected from the talk**

- **An 8-point FFT, step by step.** Decimation-in-frequency does the mirror image (natural-order in, bit-reversed out). Hardware FFTs often pipeline one stage per clock.
- **Windowing: fixing the seam.** Choose the window for the job: Hann for general use, flat-top for amplitude accuracy, Blackman–Harris for dynamic range (−92 dB sidelobes), Kaiser for a tunable trade-off. Correct coherent gain and equivalent noise bandwidth when reading absolute levels.
- **IFFT: from frequencies back to readings.** Fast convolution: y = IFFT(FFT(x) · FFT(h)) is circular convolution; overlap-add or overlap-save with zero padding makes it linear. It beats direct convolution for filter lengths above roughly 64 taps.
- **Where the FFT lives: Wi-Fi, LTE and 5G.** The cyclic prefix turns the channel's linear convolution into a circular one, so a multipath channel becomes a single complex gain per subcarrier: one-tap equalisation. That is the entire reason OFDM won. 5G NR uses up to 4096-point FFTs. Spectrum analysers and radar range-Doppler maps are the other big FFT users.

**Speaker notes**

Not presented. Reference material: the expert corners from Parts 4 and 5.

### Slide 51 · Questions? · 1 min

**References**

- R. G. Lyons, Understanding Digital Signal Processing, 3rd ed. (start here if you are new)
- A. V. Oppenheim, R. W. Schafer, Discrete-Time Signal Processing, 3rd ed.
- W. Kester (ed.), The Data Conversion Handbook, Analog Devices (everything about ADCs)
- B. Razavi, RF Microelectronics, 2nd ed.
- J. W. Cooley, J. W. Tukey, "An algorithm for the machine calculation of complex Fourier series", 1965

**Speaker notes**

Thank the room. Point beginners to Lyons first; experts to Kester for ADC detail.
