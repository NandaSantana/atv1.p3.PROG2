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

  
    if (pathname === "/items" && method === "GET") {
      const items = await todo.getItems();
      const itemsData = items.map(item => item.toJSON());

      const pageParam = searchParams.get("page");
      const limitParam = searchParams.get("limit");

     
      if (!pageParam && !limitParam) {
        return new Response(JSON.stringify(itemsData), {
          headers: { "Content-Type": "application/json" }
        });
      }

      const page = parseInt(pageParam || "1");
      const limit = parseInt(limitParam || "10");

      if (isNaN(page) || page < 1) {
        return new Response(JSON.stringify({ error: "Invalid 'page' parameter. Must be a positive integer." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (isNaN(limit) || limit < 1) {
        return new Response(JSON.stringify({ error: "Invalid 'limit' parameter. Must be a positive integer." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const totalItems = itemsData.length;
      const totalPages = Math.ceil(totalItems / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedItems = itemsData.slice(startIndex, endIndex);

      return new Response(JSON.stringify({
        data: paginatedItems,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    
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

        const existingItem = await todo.findItemByDescription(description);
        if (existingItem) {
          const existingData = existingItem.toJSON();
          const currentItem = await todo.findItemByIndex(index);
          const currentData = currentItem?.toJSON();

      
          if (!currentItem || currentData?.description !== description) {
            return new Response(JSON.stringify({
              error: "Conflict: an item with this description already exists.",
              conflictingItem: existingData
            }), {
              status: 409,
              headers: { "Content-Type": "application/json" }
            });
          }
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