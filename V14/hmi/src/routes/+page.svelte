<script lang="ts">
  import HMIView from "../view/HMI.svelte";
  import data from "../data/data";
  import MQTT from "../mqtt/MQTT";

  MQTT.send("/getState", "");
</script>

<div>
  <HMIView hmi={data["V14"]} />
</div>
