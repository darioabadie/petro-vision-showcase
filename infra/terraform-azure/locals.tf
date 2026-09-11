locals {
  # Flat list of {name, shard, replica, index} — one entry per ClickHouse node,
  # independent of shard_count/replicas_per_shard so changing either variable
  # regenerates this automatically.
  node_specs = flatten([
    for shard in range(1, var.shard_count + 1) : [
      for replica in range(1, var.replicas_per_shard + 1) : {
        name    = "ch-s${shard}-r${replica}"
        shard   = shard
        replica = replica
        index   = (shard - 1) * var.replicas_per_shard + replica
      }
    ]
  ])

  # Single source of truth consumed by the for_each on the VM/NIC resources.
  ch_nodes = {
    for spec in local.node_specs : spec.name => merge(spec, {
      private_ip = cidrhost(var.subnet_address_prefix, var.node_ip_base + spec.index)
    })
  }

  # Same nodes, grouped by shard, shaped for the remote_servers.xml template
  # (one <shard> block per shard, one <replica> per node in that shard).
  cluster_shards = [
    for shard in range(1, var.shard_count + 1) : {
      shard_num = shard
      replicas = [
        for node in local.ch_nodes : {
          host = node.private_ip
          port = var.clickhouse_native_port
        } if node.shard == shard
      ]
    }
  ]
}
