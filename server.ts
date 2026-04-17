import { ToDo } from "./core";
import { Item } from "./core";

const filepath = "./lista.json";
const todo = new ToDo(filepath);
const port = 3000;

const server = Bun.serve({
  port: port,
  async fetch(request: Request) {
    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;
    const searchParams = url.searchParams;

    // GET /items - listar todos os itens
    if (pathname === "/items" && method === "GET") {
      const items = await todo.getItems();
      const itemsData = items.map(item => item.toJSON());
      return new Response(JSON.stringify(itemsData), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // POST /items - adicionar novo item
    if (pathname === "/items" && method === "POST") {
      try {
        const body = await request.json();
        const { description } = body;
        
        if (!description) {
          return new Response(JSON.stringify({ error: "Description is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        const item = new Item(description);
        await todo.addItem(item);
        
        return new Response(JSON.stringify({ message: "Item added successfully", item: item.toJSON() }), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to add item" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // PUT /items?index=0 - atualizar item
    if (pathname === "/items" && method === "PUT") {
      try {
        const index = parseInt(searchParams.get("index") || "");
        
        if (isNaN(index)) {
          return new Response(JSON.stringify({ error: "Invalid index parameter" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        const body = await request.json();
        const { description } = body;

        if (!description) {
          return new Response(JSON.stringify({ error: "Description is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        const item = new Item(description);
        await todo.updateItem(index, item);

        return new Response(JSON.stringify({ message: "Item updated successfully", item: item.toJSON() }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to update item" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // DELETE /items?index=0 - remover item
    if (pathname === "/items" && method === "DELETE") {
      try {
        const index = parseInt(searchParams.get("index") || "");
        
        if (isNaN(index)) {
          return new Response(JSON.stringify({ error: "Invalid index parameter" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        await todo.removeItem(index);
        
        return new Response(JSON.stringify({ message: "Item removed successfully" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to remove item" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
});

console.log(`Servidor rodando em http://localhost:${port}`);