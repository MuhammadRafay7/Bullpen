import type { BullpenPluginManifestV1 } from "@bullpen/plugin-sdk";

const PLUGIN_ID = "bullpen.exe-dev-sandbox-provider";
const PLUGIN_VERSION = "0.1.1";

const manifest: BullpenPluginManifestV1 = {
  id: PLUGIN_ID,
  apiVersion: 1,
  version: PLUGIN_VERSION,
  displayName: "exe.dev Sandbox Provider",
  description:
    "Sandbox provider plugin that provisions exe.dev VMs as Bullpen execution environments.",
  author: "Bullpen",
  categories: ["automation"],
  capabilities: ["environment.drivers.register"],
  entrypoints: {
    worker: "./dist/worker.js",
  },
  environmentDrivers: [
    {
      driverKey: "exe-dev",
      kind: "sandbox_provider",
      displayName: "exe.dev VM",
      description:
        "Provisions exe.dev VMs through the HTTPS API, then runs commands over direct SSH for long-lived Bullpen workloads.",
      configSchema: {
        type: "object",
        properties: {
          // ---- Essentials (always visible, in this order) ----
          apiKey: {
            type: "string",
            format: "secret-ref",
            description:
              "Paste your exe.dev API token, or pick a saved Bullpen secret. Create one at exe.dev → Settings → API tokens with `/exec` scope (`new`, `ls`, `rm`).",
          },
          sshPrivateKey: {
            type: "string",
            format: "secret-ref",
            maxLength: 8192,
            description:
              "Paste the SSH private key you registered with exe.dev, or pick a saved secret. Leave blank to fall back to an on-host key (see Advanced → SSH access).",
          },
          // ---- Advanced: SSH access ----
          sshUser: {
            type: "string",
            description:
              "Login user on the VM. Leave blank to use the image default, usually `root`.",
            "x-bullpen-advanced": true,
            "x-bullpen-group": "SSH access",
          },
          sshIdentityFile: {
            type: "string",
            description:
              "Absolute path to a private key on the Bullpen host. Used only when SSH Private Key is empty.",
            "x-bullpen-advanced": true,
            "x-bullpen-group": "SSH access",
          },
          sshPort: {
            type: "number",
            description: "SSH port for direct VM access.",
            default: 22,
            "x-bullpen-advanced": true,
            "x-bullpen-group": "SSH access",
          },
          strictHostKeyChecking: {
            type: "string",
            description:
              "Host key policy passed to ssh via StrictHostKeyChecking. Typical values are `accept-new`, `yes`, or `no`.",
            default: "accept-new",
            "x-bullpen-advanced": true,
            "x-bullpen-group": "SSH access",
          },
          // ---- Advanced: VM resources ----
          image: {
            type: "string",
            description: "Optional container image to use when creating the VM.",
            "x-bullpen-advanced": true,
            "x-bullpen-group": "VM resources",
          },
          cpu: {
            type: "number",
            description: "Optional CPU count passed to `exe.dev new --cpu`.",
            "x-bullpen-advanced": true,
            "x-bullpen-group": "VM resources",
          },
          memory: {
            type: "string",
            description: "Optional memory size such as `4GB`.",
            "x-bullpen-advanced": true,
            "x-bullpen-group": "VM resources",
          },
          disk: {
            type: "string",
            description: "Optional disk size such as `20GB`.",
            "x-bullpen-advanced": true,
            "x-bullpen-group": "VM resources",
          },
          // ---- Advanced: VM creation ----
          command: {
            type: "string",
            description: "Optional container command passed to `exe.dev new --command`.",
            "x-bullpen-advanced": true,
            "x-bullpen-group": "VM creation",
          },
          env: {
            type: "object",
            description: "Optional environment variables applied at VM creation time.",
            additionalProperties: { type: "string" },
            "x-bullpen-advanced": true,
            "x-bullpen-group": "VM creation",
          },
          integrations: {
            type: "array",
            description: "Optional exe.dev integrations to attach during VM creation.",
            items: { type: "string" },
            "x-bullpen-advanced": true,
            "x-bullpen-group": "VM creation",
          },
          tags: {
            type: "array",
            description: "Optional tags to apply during VM creation.",
            items: { type: "string" },
            "x-bullpen-advanced": true,
            "x-bullpen-group": "VM creation",
          },
          setupScript: {
            type: "string",
            description: "Optional first-boot setup script passed to `exe.dev new --setup-script`.",
            "x-bullpen-advanced": true,
            "x-bullpen-group": "VM creation",
          },
          prompt: {
            type: "string",
            description: "Optional Shelley prompt passed to `exe.dev new --prompt`.",
            "x-bullpen-advanced": true,
            "x-bullpen-group": "VM creation",
          },
          comment: {
            type: "string",
            description: "Optional short note attached to created VMs.",
            "x-bullpen-advanced": true,
            "x-bullpen-group": "VM creation",
          },
          namePrefix: {
            type: "string",
            description: "Optional prefix used when generating VM names.",
            default: "bullpen",
            "x-bullpen-advanced": true,
            "x-bullpen-group": "VM creation",
          },
          // ---- Advanced: API + runtime ----
          apiUrl: {
            type: "string",
            description:
              "Optional exe.dev HTTPS API base URL or /exec endpoint. Defaults to https://exe.dev/exec.",
            "x-bullpen-advanced": true,
            "x-bullpen-group": "API + runtime",
          },
          timeoutMs: {
            type: "number",
            description: "Timeout for VM lifecycle and SSH operations in milliseconds.",
            default: 300000,
            "x-bullpen-advanced": true,
            "x-bullpen-group": "API + runtime",
          },
          reuseLease: {
            type: "boolean",
            description:
              "Whether to keep the VM alive between runs instead of deleting it on release.",
            default: false,
            "x-bullpen-advanced": true,
            "x-bullpen-group": "API + runtime",
          },
        },
      },
    },
  ],
};

export default manifest;
