import {
  queuer_preparator,
  throttle,
  debounce,
} from "./modules/performance.js";

const setup_knobs = () => {
  let knobs = document.querySelectorAll(`[knob] input`);

  const treat_percentages = (parent, knob) => {
    let siblings = parent.querySelectorAll(
      `input[type="text"]:not([name="${knob.attributes.name.value}"])`
    );

    let old_value = Number(knob.attributes["old-value"].value);

    let range = document.querySelector(
      `[name="${knob.attributes.name.value}-range"]`
    );
    let range_min = range.attributes.min.value;
    let range_max = range.attributes.max.value;

    const probability = (n) => {
      return Math.random() < n;
    };

    const absorb_others = (diff) => {
      let amount = diff;
      let nothing_to_absorb = 0;

      while (amount > 0 && nothing_to_absorb != siblings.length) {
        nothing_to_absorb = 0;

        for (let i = 0; i < siblings.length; i++) {
          if (siblings[i].value <= range_min) {
            nothing_to_absorb++;
            continue;
          }

          if (probability(0.1 + 0.1 * i)) {
            siblings[i].value--;
            siblings[i].dispatchEvent(new Event("change-correspondent"));
            siblings[i].setAttribute("old-value", siblings[i].value);
            amount--;

            if (amount == 0) return;
          }
        }
      }
    };

    const distribute_to_others = (diff) => {
      let amount = diff;

      while (amount > 0) {
        for (let i = 0; i < siblings.length; i++) {
          if (siblings[i].value === range_max) continue;

          if (probability(0.8 - 0.1 * i)) {
            siblings[i].value++;
            siblings[i].dispatchEvent(new Event("change-correspondent"));
            siblings[i].setAttribute("old-value", siblings[i].value);
            amount--;

            if (amount == 0) return;
          }
        }
      }
    };

    let current_value = Number(knob.value);

    if (knob.value > old_value) {
      absorb_others(current_value - old_value);
    } else if (knob.value < old_value) {
      distribute_to_others(old_value - knob.value);
    }

    knob.setAttribute("old-value", current_value);
  };

  for (let i = 0; i < knobs.length; i++) {
    let parent = knobs[i].closest(`[knob]`);

    if (knobs[i].attributes.type.value === "range") {
      let number = knobs[i].attributes.name.value.replace("-range", "");
      let correspondent = parent.querySelector(`[name="${number}"]`);

      if (!correspondent) continue;

      correspondent.addEventListener("keydown", () => {
        knobs[i].value = correspondent.value;
      });
      correspondent.addEventListener("change", () => {
        knobs[i].value = correspondent.value;

        if (!correspondent.hasAttribute("old-value"))
          correspondent.setAttribute("old-value", correspondent.value);

        window.debouncer(
          () => {
            treat_percentages(parent, correspondent);
          },
          5,
          "treat_percentages"
        );
      });
      correspondent.addEventListener("change-preset", () => {
        knobs[i].value = correspondent.value;
        correspondent.setAttribute("old-value", correspondent.value);
      });
      correspondent.addEventListener("change-correspondent", () => {
        knobs[i].value = correspondent.value;
      });
    } else {
      let range = `${knobs[i].attributes.name.value}-range`;
      let correspondent = parent.querySelector(`[name="${range}"]`);

      if (!correspondent) continue;

      correspondent.addEventListener("mousemove", () => {
        window.throttler(
          () => {
            correspondent.dispatchEvent(new Event("change"));
          },
          25,
          `mouse-over-range-${i}`
        );
      });

      correspondent.addEventListener("change", () => {
        knobs[i].value = correspondent.value;
        knobs[i].dispatchEvent(new Event("change"));
      });
    }
  }
};

const setup_presets = () => {
  let buttons = document.querySelectorAll(`[load-preset]`);

  for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", () => {
      let preset = buttons[i].attributes["load-preset"].value;
      load_preset(preset);
    });
  }
};

const load_preset = async (preset) => {
  let result = await fetch(`./assets/presets/${preset}.json`, {
    headers: {
      "Cache-Control": "no-cache",
    },
    cache: "no-cache",
  });
  result = await result.json();

  let keys = Object.keys(result);
  let values = Object.values(result);

  const setup_knob = (amalgamation, value) => {
    let knob = document.querySelector(`[knob] [name="${amalgamation}"]`);
    if (!knob) return;

    knob.value = value;
    knob.dispatchEvent(new Event("change-preset"));
  };

  const recursive_check = (current_key, current_value) => {
    let entries = Object.entries(current_value);

    for (const [key, value] of entries) {
      if (typeof value === "object") {
        recursive_check(`${current_key}-${key}`, value);
        continue;
      }

      setup_knob(`${current_key}-${key}`, value);
    }
  };

  for (let i = 0; i < values.length; i++) {
    if (typeof values[i] === "object") {
      recursive_check(keys[i], values[i]);
      continue;
    }

    setup_knob(keys[i], values[i]);
  }
};

const setup_inputs = () => {};

window.addEventListener("load", () => {
  queuer_preparator();
  window.throttler = throttle;
  window.debouncer = debounce;

  setup_presets();
  setup_inputs();
  setup_knobs();
});
